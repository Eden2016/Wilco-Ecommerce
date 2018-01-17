const tokenExpiration = '168h';
var mysql = require('mysql');
var async = require('async');
const con = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    debug: false
});

var family_breaks = {
    'F' : {},
    'H' : {},
    'J' : {},
    'K' : {},
    'L' : {},
    'Q' : {}
};

var active_family_break_codes = { };

var specialty_price_methods = {
    'B' : 'Markup from replacement cost',
    'D' : 'Down from retail',
    'n' : 'Dollars off from price matrix 1 (retail?)',
    '*' : 'Replace cost with'
};

var quantity_breaks_codes = { // a reference for the ones actually being used
    'D' : 'Dollars off',
    'F' : 'Family break quantity',
    'L' : 'Family break quantity/dollars off',
    'M' : 'Markup from cost',
    'P' : 'Percent discount'
};

const DEBUG = false;

// helper, returns true if specialty discount type, otherwise it is quantity break
function is_specialty_discount(discount) {
    return discount.category != null;
}

// doesn't really group anymore in final result, but still a good helper function
function filter_discounts(discounts) {
    var grouped_discounts = {};
    var final_discounts = [];
    for (var i = 0; i < discounts.length; i++) {
        if (grouped_discounts[discounts[i].sku]) { }
        else { grouped_discounts[discounts[i].sku] = [] }
        grouped_discounts[discounts[i].sku].push(discounts[i]);
    }

    // filter out the bad specialty discounts, make sure not to lose the quantity based discounts
    for (var i = 0; i < Object.keys(grouped_discounts).length; i++) {
        var sku = Object.keys(grouped_discounts)[i];
        var disc = filter_lowest_discount_type(grouped_discounts[sku]);
        for (var j = 0; j < grouped_discounts[sku].length; j++) {
            if (!is_specialty_discount(grouped_discounts[sku][j])) { // make sure not to disclude quantity discounts
                final_discounts.push(grouped_discounts[sku][j]);
            }
        }
        if (disc) {
            final_discounts.push(disc); // if it doesnt have a specialty discount don't push it
        }

    }
    if (DEBUG) { console.log('final discounts:'); console.log( final_discounts); }
    return final_discounts;
}

// take only the lowest level discount, i.e. SKU over class discount
function filter_lowest_discount_type(discounts) {
    //var discount_types = {'SKU': 3, 'Fineline': 2, 'Class': 1, 'Department': 0};
    var discount_types = ['SKU', 'Fineline', 'Class', 'Department'];
    for (var i = 0; i < discount_types.length; i++) {
        for (var j = 0; j < discounts.length; j++) {
            if (discounts[j].type == discount_types[i]) {
                return discounts[j];
            }
        }
    }
}

// helper for removing duplicate row
function remove_duplicate(rows, index) {
    var rows_copy = rows.slice();
    for (var i = 0; i < rows.length; i++) {
        if (i != index && rows[i].sku == rows[index].sku) {
            rows_copy.splice(i, 1);
            return rows_copy;
        }
    }
}

// helper for checking duplicate row
function has_duplicate(rows, index) {
    for (var i = 0; i < rows.length; i++) {
        if (i != index && rows[i].sku == rows[index].sku) {
            return i;
        }
    }
    return -1;
}

// determine base price, by sorting through all pricing columns
function base_price(row) {
    var base = row['Retail Price']; // just using price that im assigning from woo right now. Assigns price when sql called

    // if (row['90 Promotion Price'] != 0 && row['90 Promotion Price'] != null) {
    //     base = row['90 Promotion Price'];
    // }
    // if (row['90 Retail Price'] != 0 && row['90 Retail Price'] != null) {
    //     base = row['90 Retail Price'];
    // }
    return base;
}

// helper for determining break amount
function break_amount(row, q) {
    var levels = [5, 4, 3, 2, 1]; // number of breaks offered, ('1 Break', '2 Break', etc..)
    for (var i = 0; i < levels.length; i++) {
        if (row[levels[i] + ' Qty'] && q >= row[levels[i] + ' Qty'] && row[levels[i] + ' Break'] > 0) {
            if (DEBUG) { console.log('break evel: ' + levels[i] + ' , break amount: ' + row[levels[i] + ' Break']  + ', my quant : ' + q); }
            return parseFloat(row[levels[i] + ' Break']);
        }
    } return 0; //TODO didnt qualify for any breaks, default discount to zero (?)
}

// helper to calculate a number rounded to two decimal places, since this is often required $xx.xx
function round_cents(num) {
    return Math.round(num * 100) / 100;
}

// helper to calculate discount amount percentage
function discount_percentage(base, quantity, percentage) {
    var per_item = Math.round(base * percentage) / 100;
    var total = Math.round(base * quantity * percentage) / 100;
    if (DEBUG) { console.log('DISCOUNT-PERCENT: $' + base + ' * ' + quantity + ' items * ' + percentage + '% = $' + total + ' (Savings: $' + per_item + '/item)'); }
    return {total_discount: total, per_item_discount: per_item};
}

// helper to calculate discount by amount
function discount_amount(quantity, amount) {
    var total = Math.round(quantity*amount*100)/100;
    if (DEBUG) { console.log('DISCOUNT-AMOUNT: $' + amount + ' * ' + quantity + ' items = $' + total + ' (Savings: $' + amount + '/item)'); }
    return {total_discount: total, per_item_discount: amount};
}

// helper to calculate markup of cost
function discount_markup(base, cost, quantity, percentage) {
    var markup_cost = Math.round((cost + (cost * percentage * 0.01)) * 100) / 100;
    var markup_total = Math.round(quantity * markup_cost * 100) / 100;
    var discount_per_item = Math.round((base - markup_cost) * 100) / 100;
    var discount_total = Math.round(((base * quantity) - markup_total) * 100) / 100;
    if (DEBUG) { console.log('New cost per item: $' + markup_cost); }
    if (DEBUG) { console.log('New cost total: $' + markup_total); }
    if (DEBUG) { console.log('DISCOUNT-MARKUP-COST: $' + cost + ' * ' + quantity + ' items + ' + percentage + '% = $' + discount_total + ' (Savings: $' + discount_per_item + '/item)'); }
    return {total_discount: discount_total, per_item_discount: discount_per_item};
}

// helper to determine if there exists an actual sales price
function valid_sales_price(discount) {
    if (discount['90 Promotion Price'] != 0 &&
        discount['90 Promotion Price'] != null) {
        return true;
    }
    return false;
}

// helper to get sales difference
function sale_price_difference(discount) {
    if (valid_sales_price(discount)) {
        return (discount['Retail Price'] - discount['90 Promotion Price']) * discount['quantity'];
    }
    return 0;
}

// reset family totals after calculated
function reset_family_totals() {
    family_breaks = {
        'F' : {},
        'H' : {},
        'J' : {},
        'K' : {},
        'L' : {},
        'Q' : {}
    };
    active_family_break_codes = { };
}

// check if the sales price is better than the discounted price
function is_sales_price_better(row, discount) {
    if (DEBUG) { console.log(row['Retail Price'], discount); }
    if (DEBUG) { console.log('sales price :' + row['90 Promotion Price'] + ', discount price: ' + (row['Retail Price']-discount)); }
    if (valid_sales_price(row) &&
        row['90 Promotion Price'] <= (row['Retail Price'] - discount)) {
        if (DEBUG) { console.log('sales price BETTER!'); };
        return true;
    }
    if (DEBUG) { console.log('sales price NOT better! :', row['90 promotion Price'] <= (row['Retail Price'] - discount)); };
    return false;
}

function return_discount_object(discount, d, type) {
    // if there is a sales price, check to see if it's better than the discount
    console.log('d:', d);
    if (is_sales_price_better(discount, d.per_item_discount)) {
        d.total = discount['quantity'] * discount['90 Promotion Price'];
        d.total_discount = 0;
        d.total_display_discount = sale_price_difference(discount);
        d.per_item_discount = 0;
    } else {
        d.total = discount['quantity'] * discount['Retail Price'] - d.total_discount,
        d.total_display_discount = d.total_discount;
        d.total_discount = d.total_discount - sale_price_difference(discount);
    }
    return {
        product_id: discount['product_id'],
        sku: discount['sku'],
        type: type,
        total: d.total,
        total_discount: d.total_discount,
        per_item_discount: d.per_item_discount,
        total_display_discount: d.total_display_discount,
        quantity: discount['quantity']
    };

}

// calculate the discount for a single specialty discount object
function calculate_single_specialty_discount(sku, discount, quantity) {
    var base = base_price(discount);
    var d = 0;
    var type = "";

    if (discount['price_method'] == 'B') { // mark up from replacement cost
        d = discount_markup(base, discount['cost'], quantity, discount['price_percent']);
    } else if (discount['price_method'] == 'D') { // mark down from retail
        d = discount_percentage(base, quantity, discount['price_percent']);
    } else if (discount['price_method'] == 'n') { // dollars off retail
        d = discount_amount(quantity, parseFloat(discount['price_amount']));
    } else if (discount['price_method'] == '*') {
        d = {total_discount: quantity*(discount['Retail Price'] - discount['price_amount']),
            per_item_discount: discount['Retail Price'] - discount['price_amount']};
    }
    return return_discount_object(discount, d, 'specialty');
}

// calculate the discount for a single quantity discount object
function calculate_single_quantity_discount(row, quantity) {

    var base = base_price(row);
    var break_value = break_amount(row, quantity);
    var d = 0;

    //if there is no break for the quantity, no discount, except for family codes. those need to look at every
    // sku in the cart to tally a total quantity before we can write them off as no discount
    if (break_value == 0 && !(row['qbc_type'] in family_breaks)) {
        return ;
    }
    if (row['qbc_type'] == 'P') {
        d = discount_percentage(base, quantity, break_value);
    } else if (row['qbc_type'] == 'D') {
        d = discount_amount(quantity, break_value);
    } else if (row['qbc_type'] == 'M') {
        d = discount_markup(base, row['cost'], quantity, break_value);
    } else if (row['qbc_type'] == 'F') {
        if (!(row['qbc_code'] in family_breaks['F'])) { family_breaks['F'][row['qbc_code']] = {}; } // check if code already has a product associated with it
        family_breaks['F'][row['qbc_code']][row['sku']] = quantity; // add sku to code group
        if (!(active_family_break_codes[row['qbc_code']])) {
            active_family_break_codes[row['qbc_code']] = [];
        }
        row['quantity'] = parseInt(quantity);
        active_family_break_codes[row['qbc_code']].push(row);
        d = {total_discount: 0, per_item_discount: 0}; //TODO: temp
        return ; // return nothing i guess for now, it will be pushed somewhere else
    } else if (row['qbc_type'] == 'L') {
        if (!(row['qbc_code'] in family_breaks['L'])) { family_breaks['L'][row['qbc_code']] = {}; }
        family_breaks['L'][row['qbc_code']][row['sku']] = quantity;
        if (!(active_family_break_codes[row['qbc_code']])) {
            active_family_break_codes[row['qbc_code']] = [];
        }
        active_family_break_codes[row['qbc_code']].push(row);
        d = {total_discount: 0, per_item_discount: 0}; //TODO: temp
        return ; // return nothing i guess for now, it will be pushed somewhere else
    }
    return return_discount_object(row, d, 'quantity');
}

// helper for calculate_single_family_break_code
function sum_array_object_values (discounts, key) {
    var total = 0;
    for (var i in discounts) {
        total += discounts[i][key];
    } return total
}

// total up discounts for single family break code recursively
function calculate_single_family_break_code(_rows) {
    var discounts = [];
    var _qbc_type = _rows[0]['qbc_type'];
    var _total_for_qbc = 0;
    var total_qbc_cost = 0; // this is for 'F' type (only one currently used) or any percentage based family break

    _rows.forEach(function(_row) {
        // does not contribute to total
        if (! _row['pre_calculated_non_discount']) { // if it is honoring its' sales price, don't let it contribute to the total
            _total_for_qbc += _row['quantity'];
        }
    });

    var discount = break_amount(_rows[0], _total_for_qbc);
    if (DEBUG) { console.log(_rows); }
    if (DEBUG) { console.log('Total quantity for QBC #' + _rows[0]['qbc_code'] + ' = ' + _total_for_qbc); }

    // F is <currently> the only family type quantity break code that is being used
    if (_qbc_type == 'F' && discount > 0) {
        for (var i = 0; i < _rows.length; i++) {
            _row = _rows[i];
            if ('pre_calculated_non_discount' in _row) { // if
                discounts.push({
                    product_id: _row['product_id'],
                    sku: _row['sku'],
                    type: 'quantity-family',
                    total: _row['total'],
                    total_discount: _row['total_discount'],
                    total_display_discount: _row['total_display_discount'],
                    per_item_discount: _row['per_item_discount'],
                    quantity: _row['quantity']
                });
            }
            else { // if it has not been calculated in a previous iteration
                var _discount = Math.round(_row['quantity'] * _row['Retail Price'] * discount) / 100;
                if (! is_sales_price_better(_row, _discount / _row['quantity'])) {
                    discounts.push({
                        product_id: _row['product_id'],
                        sku: _row['sku'],
                        type: 'quantity-family',
                        total: _row['quantity'] * _row['Retail Price'] - _discount,
                        total_discount: _discount - sale_price_difference(_row),
                        total_display_discount: _discount,
                        per_item_discount: _discount / _row['quantity'],
                        quantity: _row['quantity']
                    });
                } else { // the sales price was better than the discount, now must split up and recurse
                    _rows_1 = JSON.parse(JSON.stringify(_rows));
                    _rows_2 = JSON.parse(JSON.stringify(_rows));

                    Object.assign(_rows_1[i], { // set up object as a pre-calculated discount
                        pre_calculated_non_discount: false,
                        total: _row['quantity'] * _row['Retail Price'] - _discount,
                        total_discount: _discount - sale_price_difference(_row), // TODO FIGURE THIS ONE OUT
                        total_display_discount: _discount,
                        per_item_discount: _discount / _row['quantity']
                    });
                    Object.assign(_rows_2[i], { // set up object as a pre-calculated sale price (no discount)
                        pre_calculated_non_discount: true,
                        total: _row['quantity'] * _row['90 Promotion Price'],
                        total_discount: 0,
                        total_display_discount: sale_price_difference(_row),
                        per_item_discount: 0
                    });
                    var calculation_1 = calculate_single_family_break_code(_rows_1);
                    var calculation_2 = calculate_single_family_break_code(_rows_2);

                    if (sum_array_object_values(calculation_1, 'total') < sum_array_object_values(calculation_2, 'total')) {
                        //console.log('1 choosing $' + sum_array_object_values(calculation_1, 'total') + ' over $' + sum_array_object_values(calculation_2, 'total'));
                        return calculation_1;
                    }
                    //console.log('2 choosing $' + sum_array_object_values(calculation_2, 'total') + ' over $' + sum_array_object_values(calculation_1, 'total'));
                    return calculation_2;
                }
            }
        }
    } else { // no discount
        _rows.forEach(function(_row) {
            var cost_to_use = (_row['90 Promotion Price'] > 0) ? _row['90 Promotion Price'] : _row['Retail Price'];
            discounts.push({
                product_id: _row['product_id'],
                sku: _row['sku'],
                type: 'quantity-family',
                total: _row['quantity'] * cost_to_use,
                total_discount: 0,
                total_display_discount: sale_price_difference(_row),
                per_item_discount: 0,
                quantity: _row['quantity']
            });
        });
    }
    if (DEBUG) { console.log(discounts); }
    if (DEBUG) { console.log('TOTAL COST TO BUY IS $' + sum_array_object_values(discounts, 'total')); }
    return discounts;
}

// total up all family quantity break code type discounts
function calculate_family_totals() {
    var discount = 0;
    var discounts = [];
    if (DEBUG) { console.log(active_family_break_codes); }
    if (DEBUG) { console.log(family_breaks); }
    //console.log(active_family_break_codes);
    Object.keys(active_family_break_codes).forEach(function(_qbc) {
        var _rows = active_family_break_codes[_qbc];
        var _discounts = calculate_single_family_break_code(_rows);
        _discounts.forEach(function (_discount) {
            discounts.push(_discount);
        });
        if (DEBUG) { console.log(_discounts); }
        if (DEBUG) { console.log('TOTAL COST TO BUY QBC #' + _qbc + ' IS $' + sum_array_object_values(_discounts, 'total')); }
    });
    return discounts;
}

// take a list of product/discount information, calculate total for all their discounts
function calculate_all_discounts(rows, cart) {
    var total_discount = 0;
    var discounts = [[], 0, 0];
    for (var i = 0; i < rows.length; i++) {
        var discount;
        if (is_specialty_discount(rows[i])) {
            discount = calculate_single_specialty_discount(rows[i].sku, rows[i], cart[rows[i].sku]);
        } else {
            discount = calculate_single_quantity_discount(rows[i], cart[rows[i].sku]);
        }
        if (discount) {
            discounts[0].push(discount);
            discounts[1] += discount.total_discount;
            discounts[2] += discount.total_display_discount;
        }

    }
    var family_totals = calculate_family_totals();
    family_totals.forEach(function(family_discount) {
        discounts[0].push(family_discount);
        discounts[1] += family_discount.total_discount;
        discounts[2] += family_discount.total_display_discount
    });
    //discounts[0] = discounts[0].filter(function (d) { return d.total_discount > 0; }); // filter out all results with no discount
    if (DEBUG) { console.log('total_discount: $' + discounts[1]); }
    reset_family_totals();
    return discounts;
}

// permutate every combination of product discount (quantity-based discount vs specialty discount) to see which is best
function perm(rows, cart) {

    for (var i = 0; i < rows.length; i++) {
        // if a product has two discounts in the array, example:
        // [product1.specialty, product1.quantity, product2.quantity ]
        // split the array and recursively handle the two resulting arrays
        // [product1.specialty, product2.quantity]  &&  [product1.quantity, product2.quantity]
        if ((duplicate = has_duplicate(rows, i)) != -1) {
            var discount1 = perm(remove_duplicate(rows, duplicate), cart);
            var discount2 = perm(remove_duplicate(rows, i), cart);
            if (discount1[1] > discount2[1]) {
                return discount1;
            } else {
                return discount2;
            }
        }
    }
    // if the discount array is searched with a 1->1 relation of products->discounts, then it is ready to calculate value
    return calculate_all_discounts(rows, cart);
}

// older version, phasing out
exports.get_specialty_program_discounts = function (req, res) {
    if (DEBUG) { console.log('using old'); }
    var full_cart = req.body.full_cart;
    if (!full_cart || Object.keys(full_cart).length == 0) {
        res.json(['cart is empty']);
        return ;
    }
    var cart = Object.keys(full_cart);
    var category_plan = req.body.category_plan;
    var query = "";
    var where_clause = "WHERE (";
    for (var i = 0; i < cart.length; i++) {
        if (i > 0) {
            where_clause += ' OR ';
        }
        where_clause += 'pm.`Item Number` = ' + cart[i];
    } where_clause += ")";
    var no_cat_query = "SELECT pm.`Item Number` AS sku, null AS category, null AS price_method, null AS price_percent, null AS price_amount, null AS category_plan, null AS type, pm.`Retail Price`, pl.`90 Retail Price`, " +
        "pl.`90 Promotion Price`, qbc.Code AS qbc_code, qbc.Type AS qbc_type, qbc.Note, qbc.`1 Qty`, qbc.`1 Break`, " +
        "qbc.`2 Qty`, qbc.`2 Break`, qbc.`3 Qty`, qbc.`3 Break`, qbc.`4 Qty`, qbc.`4 Break`, qbc.`5 Qty`, " +
        "qbc.`5 Break`, pm.`Replacement Cost` AS cost FROM quantity_break_codes AS qbc\n" +
        "JOIN products_master AS pm ON qbc.`Code`= pm.`Quantity Break Code`\n" +
        "JOIN products_location AS pl on pm.`Item Number` = pl.`Item Number`\n" +
        where_clause + ";";
    if (category_plan) {
        query =
            "SELECT pm.`Item Number` AS sku, spd.category, spd.price_method, spd.price_percent, spd.price_amount, " +
            "spd.category_plan, spd.type, pm.`Retail Price`, pl.`90 Retail Price`, pl.`90 Promotion Price`, " +
            "null AS qbc_code, null AS qbc_type, null as Note, null AS `1 Qty`, null AS `1 Break`, null AS `2 Qty`, " +
            "null AS `2 Break`, null AS `3 Qty`, null AS `3 Break`, null AS `4 Qty`, null AS `4 Break`, null AS `5 Qty`, " +
            "null AS `5 Break`, pm.`Replacement Cost` AS cost FROM products_master AS pm JOIN specialty_program_discounts AS spd\n" +
            "ON (pm.`Current Class Code` = spd.category AND spd.type = 'Class') OR " +
            "(pm.`Current Department Code` = spd.category AND spd.type = 'Department') OR " +
            "(pm.`Current Fineline Code` = spd.category AND spd.type = 'Fineline') OR " +
            "(pm.`Item Number` = spd.category AND spd.type = 'SKU') " +
            "JOIN products_location AS pl ON pm.`Item Number` = pl.`Item Number`\n" +
            where_clause + " AND spd.category_plan = '" + category_plan + "'\n" +
            "UNION\n" +
            no_cat_query;
    } else {
        query = no_cat_query;
    }

    if (DEBUG) { console.log(query); }
    con.query(query, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }
        var discounts = [];

        if (DEBUG) { console.log(rows); }
        if (category_plan && category_plan != 0 && category_plan != '0') { // possibly multiple different specialty programs per sku, have to filter out irrelevant ones
            rows = filter_discounts(rows);
            if (DEBUG) { console.log(rows); }
            discounts = perm(rows, full_cart);
        } else { // no duplicates of skus, so no filtering required
            if (DEBUG) { console.log(rows); }
            discounts = perm(rows, full_cart);
        }
        res.json(discounts); // return only final total (for now..)
    });

};

// current version which will eventually be the only one
exports.get_specialty_program_discounts_new = function (req, res) {
    //res.json([[], 0]);
    //return ;
    var full_cart = req.body.full_cart;
    if (!full_cart || Object.keys(full_cart).length == 0) {
        res.json(['cart is empty']);
        return ;
    }
    var cart = Object.keys(full_cart);
    var category_plan = req.body.category_plan;
    var subtotal = req.body.subtotal;
    var query = "";
    var where_clause = "WHERE (";

    for (var i = 0; i < cart.length; i++) {
        if (i > 0) {
            where_clause += ' OR ';
        }
        where_clause += 'pm.`Item Number` = ' + cart[i];
    } where_clause += ")";
    var no_cat_query = "SELECT pm.`Item Number` AS sku, null AS category, null AS price_method, null AS price_percent, null AS price_amount, null AS category_plan, null AS type, pm.`Retail Price`, pl.`90 Retail Price`, " +
        "pl.`90 Promotion Price`, qbc.Code AS qbc_code, qbc.Type AS qbc_type, qbc.Note, qbc.`1 Qty`, qbc.`1 Break`, " +
        "qbc.`2 Qty`, qbc.`2 Break`, qbc.`3 Qty`, qbc.`3 Break`, qbc.`4 Qty`, qbc.`4 Break`, qbc.`5 Qty`, " +
        "qbc.`5 Break`, pm.`Replacement Cost` AS cost FROM quantity_break_codes AS qbc\n" +
        "JOIN products_master AS pm ON qbc.`Code`= pm.`Quantity Break Code`\n" +
        "JOIN products_location AS pl on pm.`Item Number` = pl.`Item Number`\n" +
        where_clause + ";";
    if (category_plan) {
        query =
            "SELECT pm.`Item Number` AS sku, spd.category, spd.price_method, spd.price_percent, spd.price_amount, " +
            "spd.category_plan, spd.type, pm.`Retail Price`, pl.`90 Retail Price`, pl.`90 Promotion Price`, " +
            "null AS qbc_code, null AS qbc_type, null as Note, null AS `1 Qty`, null AS `1 Break`, null AS `2 Qty`, " +
            "null AS `2 Break`, null AS `3 Qty`, null AS `3 Break`, null AS `4 Qty`, null AS `4 Break`, null AS `5 Qty`, " +
            "null AS `5 Break`, pm.`Replacement Cost` AS cost FROM products_master AS pm JOIN specialty_program_discounts AS spd\n" +
            "ON (pm.`Current Class Code` = spd.category AND spd.type = 'Class') OR " +
            "(pm.`Current Department Code` = spd.category AND spd.type = 'Department') OR " +
            "(pm.`Current Fineline Code` = spd.category AND spd.type = 'Fineline') OR " +
            "(pm.`Item Number` = spd.category AND spd.type = 'SKU') " +
            "JOIN products_location AS pl ON pm.`Item Number` = pl.`Item Number`\n" +
            where_clause + " AND spd.category_plan = '" + category_plan + "'\n" +
            "UNION\n" +
            no_cat_query;
    } else {
        query = no_cat_query;
    }

    if (DEBUG) { console.log(query); }
    con.query(query, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }
        var discounts = [];
        //console.log(rows);
        // modify sale,retail prices on the returned rows to utilize prices sent from woo
        for (var i = 0; i < rows.length; i++) {
            var sku = rows[i]['sku'];
            rows[i]['90 Promotion Price'] = full_cart[sku]['sale_price'];
            rows[i]['Retail Price'] = full_cart[sku]['regular_price'];
            rows[i]['product_id'] = full_cart[sku]['product_id'];
            rows[i]['quantity'] = full_cart[sku]['quantity'];
        }
        var return_object = {"discounts" : {}, total_calculated_discount : 0, total_display_discount : 0};
        cart.forEach(function(sku) {
            var item = full_cart[sku];
            var sales_pricing = item['sale_price'] > 0;
            var line_total_display_discount = sales_pricing ? (item['regular_price']-item['sale_price']) * item['quantity'] : 0;
            return_object['discounts'][item['product_id']] = {
                line_item_with_discount: sales_pricing ? item['sale_price'] : item['regular_price'],
                line_total_with_discount: sales_pricing ? item['sale_price']*item['quantity'] : item['regular_price']*item['quantity'],
                line_total_discount: 0,
                line_total_display_discount: line_total_display_discount
            };
        });
        // retro-fit cart to look how it used to, this is only important because legacy code
        for (var i = 0; i < cart.length; i++) {
            full_cart[cart[i]] = full_cart[cart[i]]['quantity'];
        }
        if (category_plan && category_plan != 0 && category_plan != '0') { // possibly multiple different specialty programs per sku, have to filter out irrelevant ones
            rows = filter_discounts(rows);
            if (DEBUG) { console.log('back from filter'); console.log(rows); }
            discounts = perm(rows, full_cart);
        } else { // no duplicates of skus, so no filtering required
            if (DEBUG) { console.log(rows); }
            discounts = perm(rows, full_cart);
        }
        discounts[0].forEach(function (_discount) {
            return_object['discounts'][_discount['product_id']] = {
                line_item_with_discount: round_cents(_discount['total'] / _discount['quantity']),
                line_total_with_discount: round_cents(_discount['total']),
                line_total_discount: round_cents(_discount['total_discount']),
                line_total_display_discount: round_cents(_discount['total_display_discount'])
            };
        });

        Object.keys(return_object['discounts']).forEach(function(product_id) {
            return_object.total_display_discount += return_object['discounts'][product_id].line_total_display_discount;
            return_object.total_calculated_discount += return_object['discounts'][product_id].line_total_discount;
        });
        console.log(return_object);
        res.json(return_object); // return only final total (for now..)
    });

};

// to retrieve quantity break discount information for the single product view
exports.get_quantity_break_info_by_sku = function (req, res) {
    function quantity_break_info(row) {
        var response = { 'type': row['Type'], 'breaks': [] };
        var levels = [1, 2, 3, 4, 5];
        for (var i = 0; i < levels.length; i++) {
            var qty_key = levels[i] + ' Qty';
            var break_key = levels[i] + ' Break';
            if (row[qty_key] && row[break_key] > 0) {
                response['breaks'].push({});
                var break_index = response['breaks'].length-1;
                response['breaks'][break_index]['quantity'] = row[qty_key];
                response['breaks'][break_index]['break'] = row[break_key];
            }
        }
        return response;
    }
    var sku = req.body.sku;
    var query = "SELECT * FROM products_master AS pm " +
        "JOIN quantity_break_codes AS qbc ON pm.`Quantity Break Code` = qbc.`Code` " +
        "WHERE pm.`Item Number` = " + sku;
    //console.log(query);
    con.query(query, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }
        if (rows.length > 0) {
            res.json( quantity_break_info(rows[0]) ); // there should only be one record ever
        } else {
            res.json(rows);
        }
    });
};

function handle_error_message(res, err) {
    console.error(err);
    res.status(500).send({error: 'Something failed!', err: err});
}
#!/usr/bin/env nodejs

/*
 * Serve JSON to our AngularJS client
 */
// Include mysql

const tokenExpiration = '168h';

var mysql = require('mysql');
var async = require('async');

var SwiftypeApi = require('swiftype')
var swiftype = new SwiftypeApi({
  apiKey: 'ZoyyKsAx9zEzwytKSaXT'
})

var WooCommerceAPI = require('woocommerce-api');
var WooCommerce = new WooCommerceAPI({
    url: 'https://production18.hosting',
    consumerKey: 'ck_487ab0fbb354003daaaced732a317bb55eef6303',
    consumerSecret: 'cs_191aec115eeef435fd167dcca87b17e22a090b57',
    queryStringAuth: true,
    wpAPI: true,
    version: 'wc/v2'
});

var Kue = require('./KueService');


//First you need to create a connection to the db
const con = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    debug: false
});

const table_ids = ['utUtilityID', 'prProgramID', 'meMeasureID', 'ctCustomerTypeID', 'cuCustomerID', 'rbApplicationID', 'id'];

const table_names = {
    "utilities": {"table_name": "Utility", "id_name": "utUtilityID"},
    "consumers": {"table_name": "Customer", "id_name": "cuCustomerID"},
    "applications": {"table_name": "Application", "id_name": "rbApplicationID"},
    "consumerTypes": {"table_name": "CustomerType", "id_name": "ctCustomerTypeID"},
    "measures": {"table_name": "Measure", "id_name": "meMeasureID"},
    "programs": {"table_name": "Programs", "id_name": "prProgramID"},
    "products": {"table_name": "products", "id_name": "item_number"},
    "productsID": {"table_name": "products", "id_name": "id"},
    "productMaster": {"table_name": "products_master", "id_name": "`Item Number`"},
    "productBrands": {"table_name": "products_brands", "id_name": "id"},
    "productSpecies": {"table_name": "products_species", "id_name": "id"},
    "productColors": {"table_name": "products_colors", "id_name": "id"},
    "productSizes": {"table_name": "products_sizes", "id_name": "id"},
    "productDescriptions": {"table_name": "product_descriptions", "id_name": "item_number"},
    "productVariations": {"table_name": "products_variations", "id_name": "master_sku"},
    "productCategories": {"table_name": "products_categories", "id_name": "id"},
    "fineline": {"table_name": "fineline_category_assoc", "id_name": "fineline"},
    "images": {"table_name": "images", "id_name": "sku"},
    "pricing": {"table_name": "products_location", "id_name": "`Item Number`"},
    "productLocations": {"table_name": "products_location_secondary", "id_name": "`Item Number`"},
    "productUPC": {"table_name": "products_upc", "id_name": "`Item Number`"},
    "stores": {"table_name": "stores", "id_name": "id"},
    "grooming_services": {"table_name": "grooming_services", "id_name": "id"}

};

const attribute_table_ids = {
    "Color": 1, "products_colors": 1,
    "Size": 2, "products_sizes": 2
};



//@todo: for removal?
exports.name = function (req, res) {
    res.json({
        name: 'Bob'
    });
};


exports.get_featured_product_categories = function (req, res) {

    con.query('SELECT * FROM products_categories WHERE is_featured = 1', function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }

        res.json(rows);
    });

};

exports.get_products_by_search = function(req, res) {
    var term = req.params.searchTerm;

    con.query('SELECT * FROM products p WHERE INSTR(UPPER(p.product_name), UPPER(' + term + '))', function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }

        res.json(rows);

    });
};

exports.get_grooming_services = function(req, res) {
    var query_statement = "SELECT * FROM grooming_services;";

    con.query(query_statement, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }

        res.json(rows);

    });
};

exports.get_grooming_services_by_search = function(req, res) {
    var term = req.params.searchTerm;

    con.query('SELECT * FROM grooming_services gs WHERE UPPER(gs.services_name) LIKE UPPER(\'%' + term + '%\')', function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }

        res.json(rows);

    });
};


exports.get_product_brans_by_search = function(req, res) {
    var term = req.params.searchTerm;

    con.query('SELECT * FROM products_brands pb WHERE UPPER(pb.brand_name) LIKE UPPER(\'%' + term + '%\')', function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }

        res.json(rows);

    });
};

exports.get_products_by_featured = function(req, res) {
    var term = req.params.searchTerm;

    con.query('SELECT * FROM products p WHERE is_featured=1 ORDER BY featured_order', function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }

        res.json(rows);

    });
};


exports.get_product_categories_by_search = function(req, res) {
    var term = req.params.searchTerm;

    con.query('SELECT * FROM products_categories p WHERE INSTR(UPPER(p.name), UPPER(' + term + '))', function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }

        res.json(rows);

    });
};

exports.get_records = function (req, res) {

    // console.log(req);
    var key = req.params.table;

    con.query('SELECT * FROM ' + table_names[key]['table_name'], function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }

        res.json(rows);
    });

};

exports.get_existing_utilities = function (req, res) {

    var queryString = "SELECT u.utUtilityID FROM Utility u JOIN Customer c WHERE u.utUtilityID = c.cuUtilityID GROUP BY u.utUtilityID";

    con.query(queryString, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }

        res.json(rows);
    });

};

exports.get_utility_states = function (req, res) {

    var queryString = "SELECT u.utState FROM Utility u GROUP BY u.utState";

    con.query(queryString, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }

        res.json(rows);
    });

};

exports.get_existing_utilities_measures = function (req, res) {

    var queryString = "SELECT u.utUtilityID FROM Utility u JOIN Measure m WHERE u.utUtilityID = m.meUtilityID GROUP BY u.utUtilityID";

    con.query(queryString, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }

        res.json(rows);
    });

};

exports.get_applications_foreign_keys = function (req, res) {

    var queryString = "SELECT a.rbCustomerID, a.rbUtilityID FROM Application a";

    con.query(queryString, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }

        res.json(rows);
    });


};

exports.get_applications_with_consumers = function (req, res) {

    var queryString = "SELECT a.*, c.cuNameLast FROM Application a JOIN Customer c ON a.rbCustomerID = c.cuCustomerID;";

    con.query(queryString, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }

        res.json(rows);
    });
};

exports.get_existing_consumers = function (req, res) {

    var queryString = "SELECT a.rbCustomerID, c.cuUtilityID FROM Application a JOIN Customer c WHERE a.rbCustomerID = c.cuCustomerID GROUP BY a.rbCustomerID";

    con.query(queryString, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }

        res.json(rows);
    });

};


exports.get_record_by_id = function (req, res) {
    var key = req.params.table;

    con.query('SELECT * FROM ' + table_names[key]['table_name'] + ' WHERE ' + table_names[key]['id_name'] + ' = \'' + req.params.id+'\'', function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }

        res.json(rows);
    });

};


exports.update_record = function (req, res) {
    var query_args = [];
    var query_statement = 'UPDATE ' + req.body.table + ' SET ';
    var query_id;
    var query_id_key;
    var last = Object.keys(req.body.values).length - 2;
    var count = 0;

    for (var key in req.body.values) {
        if (table_ids.indexOf(key) > -1) {
            query_id_key = key;
            query_id = req.body.values[key];
            continue;
        } else {
            query_statement += " `" + key + "` = ?";
            query_args.push(req.body.values[key]);

            if (count !== last) {
                query_statement += ",";
            }
        }

        count++;
    }

    query_statement += " WHERE " + query_id_key + " = " + query_id + ";";

    con.query(query_statement, query_args, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        } else {
            res.json(
                {
                    rows: rows,
                    values: req.body.values
                }
            );
        }
    });

};

exports.update_description = function(req, res) {
    var query_statement = 'UPDATE product_descriptions SET full_desc=\''+req.body.values['full_desc']+'\' WHERE item_number=\''+req.body.values['item_number']+'\'';
    con.query(query_statement, function(err,rows) {
        if (err) {
            handle_error_message(res, err);
        } else {
            res.json(
                {
                    rows: rows,
                    values: req.body.vales
                }
            );
        }
    });
};


exports.create_record = function (req, res) {
    var query_statement = "INSERT INTO " + req.body.table + " SET ";
    var first = true;
    for (var key in req.body.values) {
        if (table_ids.indexOf(key) > -1) {
            continue;
        }

        if (first) {
            query_statement += " `" + key + "` = \'" + req.body.values[key] + "\'";
            first = false;
        } else {
            query_statement += " , `" + key + "` = \'" + req.body.values[key] + "\'";
        }

    }

    query_statement += ";";


    con.query(query_statement, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }
        res.json(rows);
    });

};

exports.delete_record = function (req, res) {
    var query_statement = "SELECT 'No Table with Entered Name'";

    for (var key in table_names) {
        if (table_names[key]['table_name'] == req.body.table) {
            query_statement = "DELETE FROM " + req.body.table + " WHERE " + table_names[key]['id_name'] + " = " + req.body.id;
        }
    }

    con.query(query_statement, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }

        res.json(rows);
    });
};

exports.get_products_master = function (req, res) {
    var query_statement = "SELECT * FROM products;";
    con.query(query_statement, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }
        res.json(rows);
    });

};

exports.find_products_master_by_SKU = function (req, res) {
    var query_statement = "SELECT * FROM products as p WHERE p.item_number LIKE \'" + req.params['sku'] + "%\' OR p.product_name LIKE \'%"+req.params['sku']+"%\';";
    con.query(query_statement, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }
        res.json(rows);
    });

};

exports.lookup_products = function (req, res) {
    var query_statement = "SELECT * FROM products as p WHERE p.item_number LIKE \'" + req.query['q'] + "%\';";
    con.query(query_statement, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }
        var data = [];
		rows.map(function(cv,i,a) {
			data.push({id:cv.item_number, text:cv.item_number+" - "+cv.product_name})
		});
        res.json(data);
    });

};

exports.get_products_by_SKU = function (req, res) {
    //var query_statement = "SELECT * FROM products as p LEFT JOIN products_master as pm ON pm.`Item Number`=p.item_number LEFT JOIN products_brands as pb ON p.brand_id = pb.id WHERE p.item_number = \'" + req.params['sku'] + "\';";
    var query_statement = "SELECT * FROM products as p WHERE p.item_number = \'" + req.params['sku'] + "\';";
    con.query(query_statement, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }
        res.json(rows);
    });
};

exports.get_products_master_by_SKU = function (req, res) {
    var query_statement = "SELECT * FROM  products_master as pm WHERE pm.'Item Number' = \'" + req.params['sku'] + "\';";
    con.query(query_statement, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }
        res.json(rows);
    });
};

exports.get_product_images_by_SKU = function (req, res) {
    var query_statement = "SELECT * FROM images as i WHERE `sku` = \'" + req.params['sku'] + "\';";
    con.query(query_statement, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }
        res.json(rows);
    });

};

exports.get_products_location_by_SKU = function (req, res) {
    var query_statement = "SELECT * FROM products_location WHERE `Item Number` = \'" + req.params['sku'] + "\';";
    con.query(query_statement,function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }
        res.json(rows);
    });
};


// transactions
Date.prototype.yyyymmdd = function() {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();
    return [this.getFullYear(),
        (mm>9 ? '' : '0') + mm,
        (dd>9 ? '' : '0') + dd
    ].join('-');
};
exports.customer_transaction_history = function (req, res) {
    var decide = (req.body.k == "super cala fragilistic expialidocious") ? 'Key good' : 'Key bad';
    console.log(decide);
    if (req.body.k !== "super cala fragilistic expialidocious") { return res.json([]); }
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var customer_number = req.body.customer_number;
    var query = "SELECT * FROM transaction_history "
        +"JOIN stores ON stores.store_number = transaction_history.`Store Number`"
        + "JOIN customer_records ON transaction_history.`Customer Number` = customer_records.`Customer Number`"
        + "WHERE transaction_history.`Customer Number` = "+ customer_number
        + " AND Date <= Date \'" + end_date
        + "\' && Date >= Date \'" +  start_date + "\' ORDER BY Date DESC;";
    console.log(query);
    con.query(query, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }
        res.json(rows);
    });
};

// customer records
exports.customer_records_lookup = function (req, res) {
    if (req.body.k != "super cala fragilistic expialidocious") { return res.json([]); }
    var area_code = req.body.phone.substring(0, 3);
    var phone = req.body.phone.substring(3);
    var zip_code = req.body.zip_code;

    var query = "SELECT * FROM customer_records WHERE `Area Code` = " + area_code
        + " AND `Phone Number` = " + phone
        + " AND `Zip Code` = " + zip_code + ";";
    console.log(query);
    con.query(query, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }
        res.json(rows);
    });
};

exports.get_customer_records = function (req, res) {
    if (req.body.k != "super cala fragilistic expialidocious") { return res.json(['no access allowed']); }
    var customer_id = req.body.customer_id;
    var query = "SELECT * FROM customer_records WHERE `Customer Number` = " + customer_id;
    console.log(query);
    con.query(query, function(err, rows) {
        if (err) {
            handle_error_message(res, err);
        }
        if (rows.length > 0) {
            return res.json(rows);
        } else {
            return res.json(['no results found']);
        }

    });
};

exports.set_customer_record_association = function (req, res) {
    if (req.body.k != "super cala fragilistic expialidocious") { return res.json(['no access allowed']); }
    var customer_number = req.body.customer_number;
    var query = "UPDATE customer_records SET `online_association_counter` = online_association_counter + 1 " +
        "WHERE `Customer Number` = '" + customer_number + "';";
    console.log(query);
    con.query(query, function(err, rows) {
        if (err) {
            handle_error_message(res, err);
        }
        res.json(rows);
    });
}

// quantity break codes
exports.quantity_break_by_code = function (req, res) {
    var code = req.params['code'];
    var query = "SELECT * FROM quantity_break_codes WHERE `Code` = " + code;
    console.log(query);
    con.query(query, function (err, rows) {
        if (err) {
            handle_error_message(res, err);
        }
        res.json(rows);
    });
};

// WooCommerce API related stuff //
exports.update_product = function (req, res) {
    function callback() {
        WooCommerce.put('products/' + req.params['id'], req.body, function(err, data, wres) {
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

exports.update_child_product = function (req, res) {
    function callback() {
        WooCommerce.put('products/' + req.params['parentID']+'/variations/'+req.params['childID'], req.body, function(err, data, wres) {
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

exports.create_product = function (req, res) {
    function callback() {
        var args = req.body;
        WooCommerce.post('products', args, function(err, data, wres) {
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

exports.create_product_variation = function (req, res) {
    function callback() {
        var args = req.body;
        WooCommerce.post('products/'+req.params['id']+'/variations', args, function(err, data, wres) {
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

exports.create_product_attribute = function (req, res) {
    function callback() {
        var args = req.body;
        WooCommerce.post('products/attributes/'+req.params['id']+'/terms', args, function(err, data, wres) {
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

exports.delete_product = function (req, res) {
    function callback() {
        var product_id = req.body.id;
        WooCommerce.delete('products/' + req.body.id + '?force=true', function(err, data, wres) {
            //console.log(wres);
            if (err) {
                handle_error_message(res, err);
            } else {
                res.json(wres);
            }
        });
    }
    Kue.runJob(req, callback);
};

exports.delete_product_variation = function (req, res) {
    function callback() {
        var product_id = req.body.id;
        WooCommerce.delete('products/' + req.body.parent_id + "/variations/" + req.body.id + '?force=true', function(err, data, wres) {
            //console.log(wres);
            if (err) {
                handle_error_message(res, err);
            } else {
                res.json(wres);
            }
        });
    }
    Kue.runJob(req, callback);
};

exports.get_products_all = function (req, res) {
    function callback() {
        WooCommerce.get('products', function(err, data, wres) {
            //console.log(wres);
            if (err) {
                handle_error_message(res, err);
            } else {
                res.json(wres);
            }

        });
    }
    Kue.runJob(req, callback);
};

exports.get_product_by_id = function (req, res) {
    function callback() {
        var product_id = req.params['id'];
        WooCommerce.get('products/' + product_id, function(err, data, wres) {
            //console.log(wres);
            if (err) {
                handle_error_message(res, err);
            } else {
                res.send(wres);
            }

        });
    }
    Kue.runJob(req, callback);
};

exports.get_product_by_sku = function (req, res) {
    function callback() {
        var product_id = req.params['id'];
        WooCommerce.get('products?sku=' + product_id, function(err, data, wres) {
            //console.log(wres);
            if (err) {
                handle_error_message(res, err);
            } else {
                res.send(wres);
            }

        });
    }
    Kue.runJob(req, callback);
};

exports.get_product_reviews = function (req, res) {
    function callback() {
        var product_id = req.params['id'];
        WooCommerce.get('products/' + product_id + '/reviews', function(err, data, wres) {
            //console.log(wres);
            if (err) {
                handle_error_message(res, err);
            } else {
                res.json(wres);
            }

        });
    }
    Kue.runJob(req, callback);
};

exports.get_product_reviews_by_id = function (req, res) {
    console.log("get_product_reviews_by_id");
    function callback() {
        WooCommerce.get('products/products/22/reviews/5', function(err, data, wres) {
            //console.log(wres);
            if (err) {
                handle_error_message(res, err);
            } else {
                res.json(wres);
            }

        });
    }
    Kue.runJob(req, callback);
};

// WoocCommerce:attribute stuff
exports.create_attribute_term = function (req, res) {

    function callback() {
        var table = req.params['attribute'];
        var attribute_id = attribute_table_ids[table];
        var args = req.body.values;
        WooCommerce.post('products/attributes/' + attribute_id + '/terms', args, function(err, data, wres) {
            /*
             var j = JSON.parse(wres);p
             console.log(j.data['status']);
             if (j.data['status'] == 400) {
             handle_error_message(res, 400);
             }
             */
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

exports.delete_attribute_term = function (req, res) {

    function callback() {
        var table = req.params['attribute'];
        var attribute_id = attribute_table_ids[table];
        var term_id = req.body.id;
        //TODO: if they dont have the woocom id for the attribute, you will have to look it up, might not necessarily be up there
        WooCommerce.delete('products/attributes/' + attribute_id + '/terms' + term_id + '?force=true', function(err, data, wres) {
            //console.log(wres);
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

exports.update_attribute_term = function (req, res) {

    function callback() {
        var table = req.params['attribute'];
        var attribute_id = attribute_table_ids[table];
        var args = req.body.values;
        //TODO: if they dont have the woocom id for the attribute, you will have to look it up, might not necessarily be up there
        WooCommerce.put('products/attributes/' + attribute_id + '/terms' + args['id'], args, function(err, data, wres) {
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

// WoocCommerce:category stuff
exports.create_category = function (req, res) {

    function callback() {
        var args = req.body.values;
        console.log(args);
        WooCommerce.post('products/categories/', args, function(err, data, wres) {
            console.log(wres);
            console.log(woo_commerce_error(wres), " , there was an error?");
            res.json(wres);
        });
    }

    Kue.runJob(req, callback);
};

exports.delete_category = function (req, res) {

    function callback() {
        WooCommerce.delete('products/categories/' + req.body.id + '?force=true', function(err, data, wres) {
            console.log(wres);
            console.log(woo_commerce_error(wres), ": there was an error?");
            res.json(wres);
        });
    }

    Kue.runJob(req, callback);
};

exports.update_category = function (req, res) {

    function callback() {
        var table = req.params['category'];
        var attribute_id = attribute_table_ids[table];
        var args = req.body.values;
        console.log("trying: products/categories/"+req.body['id']);
        WooCommerce.put('products/categories/' + req.body['id'], args, function(err, data, wres) {
            console.log(wres);
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

exports.get_categories_all = function (req, res) {
    console.log("get_categories_all");
    function callback() {
        WooCommerce.get('products/categories/', function(err, data, wres) {
            console.log(wres);
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

exports.get_category_by_id = function (req, res) {

    function callback() {
        WooCommerce.get('products/categories/' + req.params['id'], function(err, data, wres) {
            console.log(wres);
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

// WoocCommerce:brand stuff
exports.create_brand = function (req, res) {

    function callback() {
        var args = req.body.values;
        WooCommerce.post('products/brands/', args, function(err, data, wres) {
            res.json(wres);
        });
    }

    Kue.runJob(req, callback);
};

exports.delete_brand = function (req, res) {

    function callback() {
        WooCommerce.delete('products/brands/' + req.body.id + '?force=true', function(err, data, wres) {
            console.log(wres);
            console.log(woo_commerce_error(wres), ": there was an error?");
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

exports.update_brand = function (req, res) {

    function callback() {
        var table = req.params['brand'];
        var attribute_id = attribute_table_ids[table];
        var args = req.body.values;
        WooCommerce.put('products/brands/' + req.body['id'], args, function(err, data, wres) {
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

exports.get_brands_all = function (req, res) {
    console.log("get_brands_all");
    function callback() {
        WooCommerce.get('products/brands/', function(err, data, wres) {
            console.log(wres);
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

exports.get_brand_by_id = function (req, res) {

    function callback() {
        WooCommerce.get('products/brands/' + req.params['id'], function(err, data, wres) {
            console.log(wres);
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

exports.get_brand_by_name = function (req, res) {
    
    function callback() {
        console.log('products/brands?q=' + req.params['id']);
        WooCommerce.get('products/brands?q=' + req.params['id'], function(err, data, wres) {
            console.log(wres);
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

// WooCommerce:general endpoints
exports.woo_create_record = function (req, res) {

    function callback() {
        var args = req.body.values;
        console.log(args);
        WooCommerce.post('products/' + req.body.table + '/', args, function(err, data, wres) {
            console.log(wres);
            console.log(woo_commerce_error(wres), " , there was an error?");
            res.json(wres);
        });
    }

    Kue.runJob(req, callback);
};

exports.woo_delete_record = function (req, res) {

    function callback() {
        WooCommerce.delete('products/' + req.body.table + '/' + req.body.id + '?force=true', function(err, data, wres) {
            console.log(wres);
            console.log(woo_commerce_error(wres), ": there was an error?");
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

exports.woo_update_record = function (req, res) {

    function callback() {
        var table = req.params['brand'];
        var attribute_id = attribute_table_ids[table];
        var args = req.body.values;
        console.log('update brand called');
        console.log(args, req.body['id']);
        WooCommerce.put('products/' + req.body.table + '/' + req.body['id'], args, function(err, data, wres) {
            console.log(wres);
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

exports.woo_get_records = function (req, res) {

    function callback() {
        WooCommerce.get('products/' + req.body.table + '/', function(err, data, wres) {
            console.log(wres);
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

exports.woo_get_record_by_id = function (req, res) {

    function callback() {
        WooCommerce.get('products/' + req.body.table + '/' + req.params['id'], function(err, data, wres) {
            console.log(wres);
            res.json(wres);
        });
    }
    Kue.runJob(req, callback);
};

exports.parse_fineline = function(req, res) {
    console.log("Beginning parse of fineline_category table");

    // get the fineline_category data
    con.query('SELECT * FROM fineline_category', function (err, fineline_categories) {
        if (err) {
            handle_error_message(res, err);
        }

        // loop through each record
        async.forEachSeries(fineline_categories, function(fincat,firstCB) {
            var fineline = fincat.fineline;

            console.log("*** Processing: "+fincat.woo_category);

            // a reference to the previous ID
            var prevID = null;
            var prevWooID = 0;

            // split woo_category
            var cats = fincat.woo_category.split("|");
            async.forEachSeries(cats, function(cat,secondCB) {

                // does this cat name AND parent_id exist already?
                var query = 'SELECT * FROM products_categories WHERE name=\''+cat+'\' AND parent_id';
                if (prevID == null) {
                    query = query+' IS NULL;';
                } else {
                    query = query+'='+prevID+';';
                }
                
                con.query(query, function(err, existingCat) {
                    if (err) {
                        handle_error_message(res, err);
                    }

                    // check for results
                    if (existingCat.length > 0) {
                        if (existingCat[0].woo_id == null) {
                            // we found an existing cat
                            // set prevID and skip to next record
                            prevID = existingCat[0].id;

                            console.log(" found an existing cat, but no woo id");

                            // we don't know if the Woo Category exists or not
                            async.waterfall([
                                function(cb) {
                                    processWooCat(cat, prevWooID, cb);
                                }
                            ], function(err, result) {
                                prevWooID = result;
                                console.log("result: "+result);
                                con.query("UPDATE products_categories SET woo_id="+result+" WHERE id="+existingCat[0].id, function (err, result) {
                                    console.log("  updated with the woo id");
                                    secondCB();
                                });
                            });
                        } else {
                            console.log(" found an existing cat and woo id");
                            prevWooID = existingCat[0].woo_id;
                            prevID = existingCat[0].id;
                            secondCB();
                        }
                    } else {
                        // we didn't find an existing cat
                        // Woo Category probably needs creating
                        async.waterfall([
                            function(cb) {
                                processWooCat(cat, prevWooID, cb);
                            }
                        ], function(err, result) {
                            console.log("  created the woo id ("+result+"), now create the product_cat");
                            prevWooID = result;

                            // insert the category into products_categories
                            con.query('INSERT INTO products_categories (name, parent_id, woo_id) VALUES (\''+cat+'\', '+prevID+', '+prevWooID+')', function (err, newCat) {
                                if (err) {
                                    handle_error_message(res, err);
                                }
    
                                // set prevID to the id of the newly created record
                                prevID = newCat.insertId;
                                secondCB();
                                
                            });
                        });

                        
                    }
                });
            }, function() {
                // done with creating sub cats, now build the finline_category_assoc association
                // check if the fineline 
                con.query("SELECT * FROM fineline_category_assoc WHERE fineline="+fineline+" AND pcat_id="+prevID+"", function (err, existingAssoc) {
                    if (err) {
                        handle_error_message(res, err);
                    }

                    // check for results
                    if (existingAssoc.length > 0) {
                        // we found an extisting assoc, so we skip to the next finline_category record
                        firstCB();
                    } else {
                        // it doesn't exist, so create it
                        con.query("INSERT INTO fineline_category_assoc (fineline, pcat_id) VALUES ("+fineline+", "+prevID+")", function (err, newAssoc) {
                            if (err) {
                                handle_error_message(res, err);
                            }

                            firstCB();
                        });
                    }
                });
            });
        }, function() {
            console.log("Finished. Have a nice day :)");
        });
    });

    res.send("done");
}

function processWooCat(name, parent=0, cb) {
    console.log("Beginng processing woo cat: " + name+" with parent: "+parent);

    parent = (parent==null) ? 0 : parent;
    var data = {
        name: name
    };
    if (parent>0) {
        data.parent = parent;
    }

    // Just try to create the category, if it already exists it'll throw an error but return the matching category

    WooCommerce.post('products/categories/', data, function(err, data, wres) {
        var wooCat = JSON.parse(wres);
        //console.log(wres);
        if (typeof wooCat.id !== 'undefined') {
            // return new id
            console.log("  created! id: "+wooCat.id);
            cb(null, wooCat.id);
        } else {
            // probably exists, we hope
            console.log("  exists! id: "+wooCat.data.resource_id);
            cb(null, wooCat.data.resource_id);
        }
        
    });

}

function woo_commerce_error(res) {
    var json_res = JSON.parse(res);
    if (json_res.data != undefined) {
        return true;
    }
    return false
}

function handle_error_message(res, err) {
    console.error(err);
    res.status(500).send({error: 'Something failed!', err: err});
}

function isEmptyObject(obj) {
    return !Object.keys(obj).length;
}

exports.swiftDelete = function(req, res) {
    swiftype.client.delete(
        '/engines/farmstore-ecom/document_types/page/documents/destroy_url?url=' + req.body.url, 
        {}, 
        function(err, resp) {
            res.json(resp);
        }
    );

}

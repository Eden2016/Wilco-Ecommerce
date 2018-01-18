#!/usr/bin/env nodejs

/**
 * Module dependencies
 */
require('dotenv').config();

var express = require('express'),
    bodyParser = require('body-parser'),
    // methodOverride = require('method-override'),
    // errorHandler = require('error-handler'),
    morgan = require('morgan'),
    routes = require('./routes'),
    api = require('./routes/api'),
    woo = require('./routes/woo'),
    imageCatalog = require('./routes/imageCatalog'),
    featured = require('./routes/featured'),
    wooStores = require('./routes/wooStores'),
    discounts = require('./routes/discounts'),
    http = require('http'),
    path = require('path'),
    // jwt = require('jsonwebtoken');
    jwt = require('express-jwt'),
    jwksRsa = require('jwks-rsa'),
    jwtAuthz = require('express-jwt-authz'),
    robots = require('express-robots');

var app = express();

var cors = require('cors');

// KUE && REDIS

var redis = require('redis');
var kue = require('kue');
var client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);

// app.use(function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "https://middlewaretools.net");
//     res.header("Access-Control-Allow-Origin", "http://middlewaretools.net");
//     res.header("Access-Control-Allow-Origin", "https://production18.hosting");
//     res.header("Access-Control-Allow-Origin", "http://production18.hosting");
//     res.header("Access-Control-Allow-Headers", "*");
//     next();
// });


// Authentication middleware. When used, the
// access token must exist and be verified against
// the Auth0 JSON Web Key Set
const checkJwt = jwt({
    // Dynamically provide a signing key
    // based on the kid in the header and
    // the singing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: 'https://wilco.auth0.com/.well-known/jwks.json'
    }),

    // Validate the audience and the issuer.
    audience: 'https://middlewaretools.net/api/',
    issuer: 'https://wilco.auth0.com/',
    algorithms: ['RS256']
});

//we can add different combinations of scopes for different endpoints
const checkCreateScope = jwtAuthz(['create:products']);
const checkReadScope = jwtAuthz(['read:products']);
const checkUpdateScope = jwtAuthz(['update:products']);
const checkDeleteScope = jwtAuthz(['delete:products']);


/**
 * Configuration
 */

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', './views');
app.set('view engine', 'ejs');
app.use(morgan('dev'));
// app.use(methodOverride());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});
app.use(robots(__dirname + '/robots.txt'));
app.use('/kue-ui', kue.app);



var env = process.env.NODE_ENV || 'development';

// development only
if (env === 'development') {
    app.get('/api/:table', api.get_records);
    app.get('/api/:table/:id', api.get_record_by_id);
    app.post('/api/update', api.update_record);
    app.post('/api/update/description', api.update_description);
    app.post('/api/new', api.create_record);
    app.post('/api/delete', api.delete_record);

    app.get('/api/v1/get_products_by_search/:searchTerm', api.get_products_by_search);
    app.get('/api/v1/get_product_categories_by_search/:searchTerm', api.get_product_categories_by_search);

    app.get('/api/v1/get_product_brands_by_search/:searchTerm', api.get_product_brans_by_search);

    app.get('/api/v1/products/featured', api.get_products_by_featured);
    app.get('/api/v1/products/featured_categories', api.get_featured_product_categories);
    app.get('/api/v1/products/master', api.get_products_master);
    app.get('/api/v1/products/search/:sku', api.find_products_master_by_SKU);
    app.get('/api/v1/products/master/:sku', api.get_products_master_by_SKU);
    app.get('/api/v1/products/location/:sku', api.get_products_location_by_SKU);
    app.get('/api/v1/products/images/:sku', api.get_product_images_by_SKU);
    app.get('/api/v1/products/master/:sku', api.get_products_master_by_SKU);
    app.get('/api/v1/products/location/:sku', api.get_products_location_by_SKU);
    app.get('/api/v1/products/lookup', api.lookup_products);

    app.post('/api/v1/swiftype/delete', api.swiftDelete);
    app.post('/api/v1/images/sync', imageCatalog.syncImage);

    app.get('/api/v1/fineline/parse', api.parse_fineline);

    app.get('/api/v1/process/single/:sku', woo.processSingle);
    app.get('/api/v1/process/all', woo.syncAll);
    app.get('/api/v1/process/all/:lite', woo.syncAll);
    app.get('/api/v1/process/queue', woo.runWooQueue);
    app.get('/api/v1/process/queue/:lite', woo.runWooQueue);
    app.get('/api/v1/process/clear', woo.clearWooQueue);
    app.get('/api/v1/process/featured', featured.processAll);


    var corsOptions = {
        origin: ['https://middlewaretools.net', 'http://middlewaretools.net', 'https://production18.hosting', 'http://production18.hosting'],
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
    };
    app.use(cors());

    // transaction history
    app.get('/api/v1/transactions/history', api.customer_transaction_history);

    // customer records
    app.post('/api/v1/customer_records_search', api.customer_records_lookup);

    // quantity break codes
    app.get('/api/v1/quantity_break_codes/:code', api.quantity_break_by_code);

    // specialty discount programs
    app.post('/api/v1/specialty_discounts/info', discounts.get_quantity_break_info_by_sku);
    app.post('/api/v1/specialty_discounts/', discounts.get_specialty_program_discounts);
    app.post('/api/v1/specialty_discounts_new/', discounts.get_specialty_program_discounts_new);


    // WooCommerce:product endpoints
    app.put('/api/v1/products/update/:id', api.update_product); // update a product
    app.put('/api/v1/products/update/:parentID/:childID', api.update_child_product); // update a product
    app.post('/api/v1/products/new', api.create_product); // create product
    app.post('/api/v1/products/new/:id', api.create_product_variation); // create product
    app.delete('/api/v1/products/delete', api.delete_product); // delete a product X
    app.delete('/api/v1/productVariation/delete', api.delete_product_variation); // delete a product X
    app.get('/api/v1/products/all', api.get_products_all); // get all products X
    app.get('/api/v1/products/:id', api.get_product_by_id); // get product by id X
    app.get('/api/v1/products/sku/:id', api.get_product_by_sku); // get product by id X
    app.get('/api/v1/products/:id/reviews', api.get_product_reviews); // get all reviews of product X
    app.get('/api/v1/products/:id/reviews/:id', api.get_product_reviews_by_id); // get specific review of product

    // WooCommmerce:attribute endpoints
    app.post('/api/v1/products/attributes/:attribute/terms', api.create_attribute_term); // create new attribute term
    app.delete('/api/v1/products/attributes/:attribute/terms', api.delete_attribute_term); // delete attribute term
    app.put('/api/v1/products/attributes/:attribute/terms/:id', api.update_attribute_term); // update attribute term

    // WooCommerce:category endpoints
    app.post('/api/v1/products/categories', api.create_category); // create new category
    app.delete('/api/v1/products/categories', api.delete_category); // delete category
    app.put('/api/v1/products/categories/:id', api.update_category); // update category
    app.get('/api/v1/products/categories/all', api.get_categories_all); // get all categories
    app.get('/api/v1/products/categories/:id', api.get_category_by_id); // get category by id

    // WooCommerce:brand endpoints
    app.post('/api/v1/products/brands', api.create_brand); // create new brand
    app.delete('/api/v1/products/brands', api.delete_brand); // delete brand
    app.put('/api/v1/products/brands/:id', api.update_brand); // update brand
    app.get('/api/v1/products/brands', api.get_brands_all); // get all brands
    app.get('/api/v1/products/brands/:id', api.get_brand_by_id); // get brand by id

    // WooCommerce:store endpoints (WP REST API)
    //app.post('/api/v1/stores', api.create_store); // create new store
    //app.delete('/api/v1/stores', api.delete_store); // delete store
    app.post('/api/v1/stores', wooStores.processSingle); // update store
}

// production only
if (env === 'production') {

    app.use(checkJwt);

    app.get('/authorized', function (req, res) {
        res.send('Secured Resource');
    });

    app.listen(process.env.PORT);

    app.get('/api/:table', checkJwt, checkReadScope, api.get_records);
    app.get('/api/:table/:id', checkJwt, checkReadScope, api.get_record_by_id);
    app.post('/api/update', checkJwt, checkUpdateScope, api.update_record);
    app.post('/api/update/description', api.update_description);
    app.post('/api/new', checkJwt, checkUpdateScope, api.create_record);
    app.post('/api/delete', checkJwt, checkDeleteScope, api.delete_record);

    app.get('/api/v1/products/featured', checkJwt, checkReadScope, api.get_products_by_featured);
    app.get('/api/v1/products/featured_categories', checkJwt, checkReadScope, api.get_featured_product_categories);
    app.get('/api/v1/products/master', checkJwt, checkReadScope, api.get_products_master);
    app.get('/api/v1/products/search/:sku', checkJwt, checkReadScope, api.find_products_master_by_SKU);
    app.get('/api/v1/products/master/:sku', checkJwt, checkReadScope, api.get_products_master_by_SKU);
    app.get('/api/v1/products/location/:sku', checkJwt, checkReadScope, api.get_products_location_by_SKU);
    app.get('/api/v1/products/images/:sku', checkJwt, checkReadScope, api.get_product_images_by_SKU);
    app.get('/api/v1/products/lookup', api.lookup_products);

    app.post('/api/v1/swiftype/delete', api.swiftDelete);
    app.post('/api/v1/images/sync', imageCatalog.syncImage);

    app.get('/api/v1/process/single/:sku', woo.processSingle);
    app.get('/api/v1/process/all', woo.syncAll);
    app.get('/api/v1/process/all/:lite', woo.syncAll);
    app.get('/api/v1/process/queue', woo.runWooQueue);
    app.get('/api/v1/process/queue/:lite', woo.runWooQueue);
    app.get('/api/v1/process/clear', woo.clearWooQueue);
    app.get('/api/v1/process/featured', featured.processAll);

    // transaction history
    app.get('/api/v1/transactions/history', checkJwt, checkReadScope, api.customer_transaction_history);

    // customer records
    app.post('/api/v1/customer_records_search', checkJwt, checkReadScope, api.customer_records_lookup);

    // quantity break codes
    app.get('/api/v1/quantity_break_codes/:code', checkJwt, checkReadScope, api.quantity_break_by_code);

    // specialty discount programs
    app.post('/api/v1/specialty_discounts/info', checkJwt, checkReadScope, discounts.get_quantity_break_info_by_sku);
    app.post('/api/v1/specialty_discounts/', checkJwt, checkReadScope, discounts.get_specialty_program_discounts);
    app.post('/api/v1/specialty_discounts_new/', checkJwt, checkReadScope, discounts.get_specialty_program_discounts_new);

    // WooCommerce:product endpoints
    app.put('/api/v1/products/update/:id', checkJwt, checkReadScope, api.update_product); // update a product
    app.post('/api/v1/products/new', checkJwt, checkReadScope, api.create_product); // create product
    app.post('/api/v1/products/new/:id', api.create_product_variation); // create product
    app.delete('/api/v1/products/delete', checkJwt, checkReadScope, api.delete_product); // delete a product X
    app.delete('/api/v1/productVariation/delete', checkJwt, checkReadScope, api.delete_product_variation); // delete a product X
    app.get('/api/v1/products/all', checkJwt, checkReadScope, api.get_products_all); // get all products X
    app.get('/api/v1/products/:id', checkJwt, checkReadScope, api.get_product_by_id); // get product by id X
    app.get('/api/v1/products/sku/:id', checkJwt, checkReadScope, api.get_product_by_sku); // get product by id X
    app.get('/api/v1/products/:id/reviews', checkJwt, checkReadScope, api.get_product_reviews); // get all reviews of product X
    app.get('/api/v1/products/:id/reviews/:id', checkJwt, checkReadScope, api.get_product_reviews_by_id); // get specific review of product

    // WooCommmerce:attribute endpoints
    app.post('/api/v1/products/attributes/:attribute/terms', checkJwt, checkReadScope, api.create_attribute_term); // create new attribute term
    app.delete('/api/v1/products/attributes/:attribute/terms', checkJwt, checkReadScope, api.delete_attribute_term); // delete attribute term
    app.put('/api/v1/products/attributes/:attribute/terms/:id', checkJwt, checkReadScope, api.update_attribute_term); // update attribute term

    // WooCommerce:category endpoints
    app.post('/api/v1/products/categories', checkJwt, checkReadScope, api.create_category); // create new category
    app.delete('/api/v1/products/categories', checkJwt, checkReadScope, api.delete_category); // delete category
    app.put('/api/v1/products/categories/:id', checkJwt, checkReadScope, api.update_category); // update category
    app.get('/api/v1/products/categories', checkJwt, checkReadScope, api.get_categories_all); // get all categories
    app.get('/api/v1/products/categories/:id', checkJwt, checkReadScope, api.get_category_by_id); // get category by id

    // WooCommerce:brand endpoints
    app.post('/api/v1/products/brands', checkJwt, checkReadScope, api.create_brand); // create new brand
    app.delete('/api/v1/products/brands', checkJwt, checkReadScope, api.delete_brand); // delete brand
    app.put('/api/v1/products/brands/:id', checkJwt, checkReadScope, api.update_brand); // update brand
    app.get('/api/v1/products/brands', checkJwt, checkReadScope, api.get_brands_all); // get all brands
    app.get('/api/v1/products/brands/:id', checkJwt, checkReadScope, api.get_brand_by_id); // get brand by id

    // WooCommerce:store endpoints (WP REST API)
    //app.post('/api/v1/stores', checkJwt, checkReadScope, api.create_store); // create new store
    //app.delete('/api/v1/stores', checkJwt, checkReadScope, api.delete_store); // delete store
    app.post('/api/v1/stores', checkJwt, checkReadScope, wooStores.processSingle); // update store
}


/**
 * Routes
 */

// serve index and view partials
app.get('/', routes.index);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);


/**
 * Start Server
 */

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
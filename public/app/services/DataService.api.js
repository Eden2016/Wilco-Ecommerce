'use strict';

app.factory('DataService.cache', ['$cacheFactory', function ($cacheFactory) {
    return $cacheFactory('cache');
}]);
app.service('DataService.api', ['$http', 'DataService.cache', 'MessagingService', 'authService', function ($http, DataServiceCache, MS, authService, angularAuth0) {

    this.getTable = function (table) { // more generic way of pulling table, rather than having separate function for each app
        return $http({
            method: 'GET',
            url: '/api/' + table
        });
    };

    this.getUtilities = function () {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/utilities',
            cache: DataServiceCache,
        });

        return ret;
    };

    this.getProducts = function () {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/v1/products/master',
        });

        return ret;
    };

    this.getFeaturedProducts = function () {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/v1/products/featured',
        });

        return ret;
    };
    
    this.getProductsBySKU = function (sku) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/products/'+sku,
            cache: DataServiceCache,
        });

        return ret;
    };

    this.findFineline = function(fineline) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/fineline/'+fineline,
            cache: DataServiceCache,
        });

        return ret;
    }
    
    this.getProductByID = function (sku) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/productsID/'+sku,
            cache: DataServiceCache,
        });

        return ret;
    };

    this.getProductsBySearch = function (searchTerm) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/v1/get_products_by_search/'+ searchTerm,
            cache: DataServiceCache,
        });

        return ret;
    };

    this.getProductCategoriesBySearch = function (searchTerm) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/v1/get_product_categories_by_search/'+ searchTerm,
            cache: DataServiceCache,
        });

        return ret;
    };
    
    this.getProductImagesBySKU = function (sku) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/v1/products/images/'+sku,
            cache: DataServiceCache,
        });

        return ret;
    };
    
    this.getProductPricingBySKU = function (sku) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/pricing/'+sku,
            cache: DataServiceCache,
        });

        return ret;
    };
    
    this.getProductLocationsBySKU = function (sku) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/productLocations/'+sku,
            cache: DataServiceCache,
        });

        return ret;
    };
    
    this.getProductUPCBySKU = function (sku) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/productUPC/'+sku,
            cache: DataServiceCache,
        });

        return ret;
    };
    
    this.getProductMasterBySKU = function (sku) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/productMaster/'+sku,
            cache: DataServiceCache,
        });

        return ret;
    };
    
    this.findProductsBySKU = function (sku) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/v1/products/search/'+sku,
            cache: DataServiceCache,
        });

        return ret;
    };

    this.getProductDescriptions = function (item_number) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/productDescriptions/'
        });

        return ret;
    };

    this.getProductBrands = function () {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/productBrands'
        });

        return ret;
    };

    this.getProductSpecies = function () {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/productSpecies'
        });

        return ret;
    };

    this.getProductColors = function () {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/productColors'
        });

        return ret;
    };

    this.getProductSizes = function () {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/productSizes'
        });

        return ret;
    };

    this.getProductCategories = function () {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/productCategories'
        });

        return ret;
    };

    this.getUtilityStates = function () {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/meta/utilityStates',
            cache: DataServiceCache,
        });

        return ret;
    };

    this.getConsumers = function () {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/consumers',
            cache: DataServiceCache,
        });

        return ret;
    };

    this.getConsumerTypes = function () {
        //return http promise
        return $http({
            method: 'GET',
            url: '/api/consumerTypes',
            cache: DataServiceCache,
        });
    };


    this.getPrograms = function () {
        //return http promise
        return $http({
            method: 'GET',
            url: '/api/programs',
            cache: DataServiceCache,
        });
    };

    this.getMeasures = function () {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/measures',
            cache: DataServiceCache,
        });

        return ret;
    };

    this.getExistingUtilities = function () {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/meta/existingUtilities',
            cache: DataServiceCache,
        });

        return ret;
    };
    
    this.getExistingProducts = function () {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/v1/products/master',
            cache: DataServiceCache,
        });

        return ret;
    };

    this.getExistingUtilitiesMeasures = function () {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/meta/existingUtilitiesMeasures',
            cache: DataServiceCache,
        });

        return ret;
    };

    this.getApplicationsWithConsumers = function () {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/meta/getApplicationsWithConsumers',
            cache: DataServiceCache,
        });

        return ret;
    };

    this.getApplicationsForeignKeys = function () {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/meta/getApplicationsForeignKeys',
            cache: DataServiceCache,
        });

        return ret;
    };

    this.getExistingConsumers = function () {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/meta/existingConsumers',
            cache: DataServiceCache,
        });

        return ret;
    };

    this.getUtility = function (id) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/utilities/'+id,
            cache: DataServiceCache
        });

        return ret;
    };
    

    this.getConsumerType = function (id) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/consumerTypes/'+id,
            cache: DataServiceCache
        });

        return ret;
    };

    this.getConsumer = function (id) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/consumers/'+id,
            cache: DataServiceCache
        });

        return ret;
    };

    this.getProgram = function (id) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/programs/'+id,
            cache: DataServiceCache
        });

        return ret;
    };

    this.getMeasure = function (id) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/measures/'+id,
            cache: DataServiceCache
        });

        return ret;
    };

    this.getUsers = function() {


        var ret = $http({
            method: 'GET',
            url: 'https://wilco.auth0.com/api/v2/users',
            cache: DataServiceCache
        });


        return ret;
    };
    
    this.updateProduct = function (product) {
        //return http promise
        if (product.images) {delete product.images;}
        if (product.pricing) {delete product.pricing;}
        if (product.locations) {delete product.locations;}
        if (product.upc) {delete product.upc;}
        if (product.master) {delete product.master;}
        if (product.created) {delete product.created;}
        if (product.updated) {delete product.updated;}

        if (product.start_date) {
            product.start_date = new Date(product.start_date).toMysqlFormat();
        }

        if (product.end_date) {
            product.end_date = new Date(product.end_date).toMysqlFormat();
        }

        var ret = $http({
            method: 'POST',
            url: '/api/update',
            data: {
                "values": product,
                "table": "products"
            }
        });

        return ret;
    };

    this.updateProductDescription = function (productDescription) {
        //return http promise
        if (productDescription.type) {delete productDescription.type;}
        console.log(productDescription);

        var ret = $http({
            method: 'POST',
            url: '/api/update/description',
            data: {
                "values": productDescription,
                "table": "product_descriptions"
            }
        });

        return ret;
    };

    this.updateProductBrand = function (productBrand) {
        //return http promise
        if (productBrand.type) {delete productBrand.type;}

        var ret = $http({
            method: 'POST',
            url: '/api/update',
            data: {
                "values": productBrand,
                "table": "products_brands"
            }
        });

        return ret;
    };

    this.updateProductSpecies = function (productSpecies) {
        //return http promise
        if (productSpecies.type) {delete productSpecies.type;}

        var ret = $http({
            method: 'POST',
            url: '/api/update',
            data: {
                "values": productSpecies,
                "table": "products_species"
            }
        });

        return ret;
    };

    this.updateProductColor = function (productColor) {
        //return http promise
        if (productColor.type) {delete productColor.type;}

        var ret = $http({
            method: 'POST',
            url: '/api/update',
            data: {
                "values": productColor,
                "table": "products_colors"
            }
        });

        return ret;
    };

    this.updateProductSize = function (productSize) {
        //return http promise
        if (productSize.type) {delete productSize.type;}

        var ret = $http({
            method: 'POST',
            url: '/api/update',
            data: {
                "values": productSize,
                "table": "products_sizes"
            }
        });

        return ret;
    };

    this.updateProductCategory = function (productCategory) {
        //return http promise
        if (productCategory.type) {delete productCategory.type;}

        if (productCategory.start_date) {
            productCategory.start_date = new Date(productCategory.start_date).toMysqlFormat();
        }

        if (productCategory.end_date) {
            productCategory.end_date = new Date(productCategory.end_date).toMysqlFormat();
        }


        var ret = $http({
            method: 'POST',
            url: '/api/update',
            data: {
                "values": productCategory,
                "table": "products_categories"
            }
        });

        return ret;
    };

    this.updateUtility = function (utility) {
        //return http promise
        if (utility.type) {delete utility.type;}
        if (utility.utRecCreated) {delete utility.utRecCreated;}
        if (utility.utRecModified) {delete utility.utRecModified;}

        if (utility.ProgramStart) {
            utility.ProgramStart = utility.ProgramStart.toMysqlFormat();
        }
        if (utility.FiscalYearStart) {
            utility.FiscalYearStart = utility.FiscalYearStart.toMysqlFormat();
        }


        var ret = $http({
            method: 'POST',
            url: '/api/update',
            data: {
                "values": utility,
                "table": "Utility"
            }
        });



        return ret;
    };

    this.updateConsumer = function (consumer) {
        //return http promise
        if (consumer.type) {delete consumer.type;}
        if (consumer.cuRecCreated) {delete consumer.cuRecCreated;}
        if (consumer.cuRecModified) {delete consumer.cuRecModified;}


        var ret = $http({
            method: 'POST',
            url: '/api/update',
            data: {
                "values": consumer,
                "table": "Customer"
            }
        });
        return ret;
    };

    this.updateApplication = function (application) {
        //return http promise
        if (application.type) {delete application.type;}
        if (application.rbRecCreated) {delete application.rbRecCreated;}
        if (application.rbRecModified) {delete application.rbRecModified;}
        if (application.cuNameLast) {delete application.cuNameLast;}

        if (application.rbEntryDate) {application.rbEntryDate = application.rbEntryDate.toMysqlFormat()}
        if (application.rbCompleteDate) {application.rbCompleteDate = application.rbCompleteDate.toMysqlFormat()}
        if (application.rbDatePurchased) {application.rbDatePurchased = application.rbDatePurchased.toMysqlFormat()}


        var ret = $http({
            method: 'POST',
            url: '/api/update',
            data: {
                "values": application,
                "table": "Application"
            }
        });

        return ret;
    };


    this.updateMeasure = function (measure) {
        //return http promise
        if (measure.type) {delete measure.type;}
        if (measure.meRecCreated) {delete measure.meRecCreated;}
        if (measure.meRecModified) {delete measure.meRecModified;}



        var ret = $http({
            method: 'POST',
            url: '/api/update',
            data: {
                "values": measure,
                "table": "Measure"
            }
        });

        return ret;
    };

    this.updateConsumerType = function (consumerType) {
        //return http promise
        if (consumerType.type) {delete consumerType.type;}


        var ret = $http({
            method: 'POST',
            url: '/api/update',
            data: {
                "values": consumerType,
                "table": "CustomerType"
            }
        });

        return ret;
    };

    this.updateProgram = function (program) {
        //return http promise
        if (program.type) {delete program.type;}


        var ret = $http({
            method: 'POST',
            url: '/api/update',
            data: {
                "values": program,
                "table": "Program"
            }
        });

        return ret;
    };

    this.deleteUtility = function (utility) {
        //return http promise
        if (utility.type) {delete utility.type;}

        var ret = $http({
            method: 'POST',
            url: '/api/delete',
            data: {
                "id": utility.utUtilityID,
                "table": "Utility"
            }
        });
        return ret;
    };

    this.deleteConsumer = function (consumer) {
        //return http promise
        if (consumer.type) {delete consumer.type;}


        var ret = $http({
            method: 'POST',
            url: '/api/delete',
            data: {
                "id": consumer.cuCustomerID,
                "table": "Customer"
            }
        });

        return ret;
    };

    this.deleteConsumerType = function (consumerType) {
        if (consumerType.type) {delete consumerType.type;}


        var ret = $http({
            method: 'POST',
            url: '/api/delete',
            data: {
                "id": consumerType.ctCustomerTypeID,
                "table": "CustomerType"
            }
        });

        return ret;
    };

    this.deleteProgram = function (program) {
        if (program.type) {delete program.type;}


        var ret = $http({
            method: 'POST',
            url: '/api/delete',
            data: {
                "id": program.prProgramID,
                "table": "Program"
            }
        });

        return ret;
    };

    this.deleteApplication = function (application) {
        //return http promise
        if (application.type) {delete application.type;}


        var ret = $http({
            method: 'POST',
            url: '/api/delete',
            data: {
                "id": application.rbApplicationID,
                "table": "Application"
            }
        });

        return ret;
    };

    this.deleteMeasure = function (measure) {
        //return http promise
        if (measure.type) {delete measure.type;}


        var ret = $http({
            method: 'POST',
            url: '/api/delete',
            data: {
                "id": measure.meMeasureID,
                "table": "Measure"
            }
        });

        return ret;
    };

    this.deleteProductBrand = function (productBrand) {
        //return http promise
        if (productBrand.type) {delete productBrand.type;}


        var ret = $http({
            method: 'POST',
            url: '/api/delete',
            data: {
                "id": productBrand.id,
                "table": "products_brands"
            }
        });

        return ret;
    };

    this.deleteProductSpecies = function (productSpecies) {
        //return http promise
        if (productSpecies.type) {delete productSpecies.type;}


        var ret = $http({
            method: 'POST',
            url: '/api/delete',
            data: {
                "id": productSpecies.id,
                "table": "products_species"
            }
        });

        return ret;
    };

    this.deleteProductColor = function (productColor) {
        //return http promise
        if (productColor.type) {delete productColor.type;}


        var ret = $http({
            method: 'POST',
            url: '/api/delete',
            data: {
                "id": productColor.id,
                "table": "products_colors"
            }
        });

        return ret;
    };

    this.deleteProductSize = function (productSize) {
        //return http promise
        if (productSize.type) {delete productSize.type;}


        var ret = $http({
            method: 'POST',
            url: '/api/delete',
            data: {
                "id": productSize.id,
                "table": "products_sizes"
            }
        });

        return ret;
    };

    this.deleteProductCategory = function (productCategory) {
        //return http promise
        if (productCategory.type) {delete productCategory.type;}


        var ret = $http({
            method: 'POST',
            url: '/api/delete',
            data: {
                "id": productCategory.id,
                "table": "products_categories"
            }
        });

        return ret;
    };


    this.login = function (data) {
        return $http({
            method: 'POST',
            url: '/api/login',
            data: {
                "values": {
                    "email" : data['email'],
                    "password" : data['password']
                }
            }
        });
    };

    this.createRecord = function (data) {
        return $http({
            method: "POST",
            url: '/api/new',
            data: data
        });
    };

    //TODO: set this up, to work like how createrecord works, with all apps? maybe
    this.updateRecord = function (data) {
        return $http({
           method: 'POST',
            url: '/api/update',
            data: data
        });
    };
    //TODO: set this up, to work like how createrecord works, with all apps? maybe
    this.deleteRecord = function (data) {
        //return http promise
        if (data.type) {delete data.type;}
        var ret = $http({
            method: 'POST',
            url: '/api/delete',
            data: {
                "id": data.id,
                "table": data.table
            }
        });
        return ret;
    };

    this.createAttributeTerm = function (data) {
        return $http({
            method: 'POST',
            url: '/api/v1/products/attributes/' + data.table + '/terms',
            data: data
        });
    };

    this.createCategory = function (data) {
        return $http({
            method: 'POST',
            url: '/api/v1/products/categories/',
            data: data
        });
    };

    this.deleteCategory = function (data) {
        return $http({
            method: 'DELETE',
            url: '/api/v1/products/categories/',
            data: {
                "id": data.id,
            }
        });
    };

    this.geocode = function(addressString) {
        return $http({
            method: "GET",
            url: 'https://maps.googleapis.com/maps/api/geocode/json?address=' +
            addressString + '&key=AIzaSyCw32rz8gwMAcdNyK7dpaWxM7o6l2lu2EA'
        });
    };

    this.wooGetProduct = function (id) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/v1/products/'+id,
        });

        return ret;
    };

    this.wooCreateProduct = function(productData) {
        return $http({
            method: 'POST',
            url: '/api/v1/products/new',
            data: productData
        });
    };

    this.wooCreateProductVariation = function(parent, productData) {
        return $http({
            method: 'POST',
            url: '/api/v1/products/new/'+parent,
            data: productData
        });
    };

    this.wooUpdateProduct = function(id, productData) {
        return $http({
            method: 'PUT',
            url: '/api/v1/products/update/'+id,
            data: productData
        });
    };

    this.wooUpdateChildProduct = function(parentID, childID, productData) {
        return $http({
            method: 'PUT',
            url: '/api/v1/products/update/'+parentID+'/'+childID,
            data: productData
        });
    };

    this.wooFullSyncSingle = function(sku) {
        return $http({
            method: 'GET',
            url: '/api/v1/process/single/'+sku
        });
    }

    this.getProductVariations = function (sku) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/productVariations/'+sku,
        });

        return ret;
    };

    this.wooAddTerm = function(term) {
        var data = {
            name: term
        };

        var ret = $http({
            method: 'POST',
            data: data,
            headers: {
                'Authorization': 'Basic V2lsY28gRmFybSBTdG9yZXM6b3hLYSA3VDI4IHRHdXMgUVNmMCBiUTBMIHVLb2k=',
            },
            url: 'https://production18.hosting/wp-json/wp/v2/species/'
        });

        return ret;
    }

    this.wooGetSpecies = function() {
        var ret = $http({
            method: 'GET',
            headers: {
                'Authorization': 'Basic V2lsY28gRmFybSBTdG9yZXM6b3hLYSA3VDI4IHRHdXMgUVNmMCBiUTBMIHVLb2k=',
            },
            url: 'https://production18.hosting/wp-json/wp/v2/species/?per_page=100'
        });

        return ret;
    }

    this.wooAssignTerms = function(product, terms) {
        var data = {
            species: terms
        };

        var ret = $http({
            method: 'POST',
            data: data,
            headers: {
                'Authorization': 'Basic V2lsY28gRmFybSBTdG9yZXM6b3hLYSA3VDI4IHRHdXMgUVNmMCBiUTBMIHVLb2k=',
            },
            url: 'https://production18.hosting/wp-json/wp/v2/product/'+product
        });

        return ret;
    }

    this.wooUploadImage = function(data) {
        var ret = $http({
            method: 'POST',
			processData: false,
            data: data,
            headers: {
                'Authorization': 'Basic V2lsY28gRmFybSBTdG9yZXM6b3hLYSA3VDI4IHRHdXMgUVNmMCBiUTBMIHVLb2k=',
                'Content-Type': undefined
            },
            url: 'https://production18.hosting/wp-json/wp/v2/media/'
        });

        return ret;
    }

    this.wooGetProductBrand = function (id) {
        //return http promise
        var ret = $http({
            method: 'GET',
            url: '/api/v1/products/brands/'+id,
        });

        return ret;
    };

    // WooCommerce:brands
    this.wooCreateProductBrand = function(productBrandData) {
        return $http({
            method: 'POST',
            url: '/api/v1/products/brands',
            data: {
                "values": productBrandData
            }
        });
    };

    this.wooUpdateProductBrand = function(id, productBrandData) {
        return $http({
            method: 'PUT',
            url: '/api/v1/products/brands/' + id,
            data: {
                id: id,
                "values": productBrandData
            }
        });
    };

    this.wooDeleteProductBrand = function(id) {
        return $http({
            method: 'DELETE',
            url: '/api/v1/products/brands/',
            id: id
        });
    };

    // WooCommerce:stores
    this.wooGetStores = function() {
        var ret = $http({
            method: 'GET',
            headers: {
                'Authorization': 'Basic V2lsY28gRmFybSBTdG9yZXM6b3hLYSA3VDI4IHRHdXMgUVNmMCBiUTBMIHVLb2k=',
            },
            url: 'https://production18.hosting/wp-json/wp/v2/store/'
        });
        return ret;
    };

    this.wooCreateStore = function(data) {
        return $http({
            method: 'POST',
            headers: {
                'Authorization': 'Basic V2lsY28gRmFybSBTdG9yZXM6b3hLYSA3VDI4IHRHdXMgUVNmMCBiUTBMIHVLb2k=',
            },
            url: 'https://production18.hosting/wp-json/wp/v2/store',
            //data: data
        });
    };

    this.processSingleStore = function(data) {
        var d = {
            store_number: data.store_number,
            post_id: data.post_id,
            meta_data: data,
            key: 'super cala fragilistic expialidocious'
        };
        console.log("data to update:", d);
        var ret = $http({
            method: 'POST',
            url: '/api/v1/stores',
            data: d
        });
        return ret;
    };

    this.wooDeleteStore = function(store_id) {
        return $http({
            method: 'DELETE',
            headers: {
                'Authorization': 'Basic V2lsY28gRmFybSBTdG9yZXM6b3hLYSA3VDI4IHRHdXMgUVNmMCBiUTBMIHVLb2k=',
            },
            url: 'https://production18.hosting/wp-json/wp/v2/store' + store_id,
        });
    };

    // WooCommerce:categories
    this.wooCreateProductCategory = function(productCategoryData) {
        return $http({
            method: 'POST',
            url: '/api/v1/products/categories',
            data: {
                "values": productCategoryData
            }
        });
    };

    this.wooUpdateProductCategory = function(id, productCategoryData) {
        return $http({
            method: 'PUT',
            url: '/api/v1/products/categories/' + id,
            data: {
                id: id,
                "values": productCategoryData
            }
        });
    };

    this.wooDeleteProductCategory = function(id) {
        return $http({
            method: 'DELETE',
            url: '/api/v1/products/categories/',
            id: id
        });
    };

    // WooCommerce general functions
    this.wooCreateRecord = function(table, data) {
        return $http({
            method: 'POST',
            url: '/api/v1/products/' + table,
            data: {
                "values": data
            }
        });
    };

    this.wooUpdateRecord = function(table, id, data) {
        return $http({
            method: 'PUT',
            url: '/api/v1/products/' + table + '/' + id,
            data: {
                id: id,
                "values": data
            }
        });
    };

    this.wooDeleteRecord = function(table, id) {
        return $http({
            method: 'DELETE',
            url: '/api/v1/products/' + table + '/',
            id: id
        });
    };

}]);
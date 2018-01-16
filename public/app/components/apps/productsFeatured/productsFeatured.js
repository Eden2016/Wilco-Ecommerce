/**
/**
 * Created by Corey on 8/8/17.
 */
'use strict';

app.controller('ProductsFeaturedCtrl', ['$scope', '$rootScope', 'DataService.api', 'WooService', 'MessagingService', 'authService', '$q', function ($scope, $rootScope, DS, WS, MS, authService, $q) {
    var vm = this;
    vm.auth = authService;

    $scope.offset = 0;
    var offset_increment = 50;

    var utilityOffset = 0;
    var utilityOffsetIncrement = 100;

    var page = 1;

    $scope.scrollMode = true;

    $scope.currentData = [];

    $scope.currentProductData = [];

    $scope.currentExisitingProductData = [];

    $scope.selectedFilter = "None";

    $scope.dayDateFormat = 'yyyy-MM-dd';

    $scope.timeDateFormat = 'MMM d, y';

    $scope.selectedConsumerTypeID = -1;

    $scope.selectedUtilityID = -1;

    $scope.selectedUtility = null;

    $scope.selectedConsumerType = null;

    $scope.utilityFilter = -1;

    $scope.utilitySelect = {};

    $scope.consumerTypeSelect = {};


    $scope.view = {
        record: {},
        highlightedItem: {},
        message: {},
        existingRecord: false,
        screen: 'single'
    };
    
    

    $scope.data = [];
    $scope.products = [];
    $scope.existingProductIDs = [];
    $scope.letters = [];
    $scope.form = {
        edit: false,
        new: false,
        master: {},
        user: {},
        activeclass: ''
    };


    
    $scope.productsGrid = { 
    	infiniteScrollDown: true,
    	enableRowSelection: true,
    	enableFullRowSelection: true,
    	enableRowHeaderSelection: false,
    	multiSelect: false,
		columnDefs: [
			{ field: "item_number", displayName: "SKU", width: 130 },
			{ field: "product_name", displayName: "Product Name" },
			{ field: "is_featured", displayName: "featured", width: 40, headerCellTemplate: " ", cellTemplate: "<span class='wicon-featured' ng-class='{test: row.entity.is_featured>0}' ng-if='row.entity.is_featured == 1' ng-click='grid.appScope.unfeature(row, $event)'></span>" }
		],
		rowHeight: 49,	
		enableSorting: false,
		enableColumnMenus: false,
        data: 'products',
        rowTemplate: '<div grid="grid" class="ui-grid-draggable-row" draggable="true"><div ng-repeat="(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name" class="ui-grid-cell" ng-class="{ \'ui-grid-row-header-cell\': col.isRowHeader, \'custom\': true }" ui-grid-cell></div></div>',
		onRegisterApi: function(gridApi){ 
			$scope.gridApi = gridApi;
			gridApi.selection.on.rowSelectionChanged($scope, function(row) {
				$scope.loadClickedRecord(row);
            });
            gridApi.draggableRows.on.rowDropped($scope, function (info, dropTarget) {
                for (var i = 1; i<= $scope.products.length; i++) {
                    $scope.products[i-1].featured_order = i;
                }
                console.log("Dropped", $scope.products);
                $scope.updateAll();
            });
		}
	};

    getProducts();

    function getProducts(callback) {

        DS.getFeaturedProducts().then(processProducts);
        if (callback) {
            callback();
        }
    }

    function getExistingProducts(callback) {
        DS.getExistingProducts().then(processExistingProducts);
    }

    function processProducts(response) {

        let tmp = [];
        

        // un-JSON our data
        response.data.forEach(function(cv,i,a) {
            try {
                cv.species_id = JSON.parse(cv.species_id);
            } catch(e) {
                console.log("Species isn't valid data");
            }
            try {
                if (cv.added_category == null) {
                    cv.added_category = [];
                } else {
                    cv.added_category = JSON.parse(cv.added_category);
                }
            } catch(e) {
                console.log("Added category isn't valid data");
            }
            try {
                if (cv.related_skus == null) {
                    cv.related_skus = [];
                } else {
                    cv.related_skus = JSON.parse(cv.related_skus);
                }
            } catch(e) {}

            // clean punctuation
            var cleanFields = ['product_name', 'feature_1', 'feature_2', 'feature_3', 'feature_4'];
            cleanFields.forEach(function(cf,i,a) {
                if (cv[cf] !== null) {
                    cv[cf] = cv[cf].replace(/\\'/g, "'");
                    cv[cf] = cv[cf].replace(/\\"/g, '"');
                }
            });
        });

        $scope.products = [];
        $scope.products = response.data;
    }


    function processExistingProducts(response) {


        var temp = $scope.products;

        angular.forEach(response.data, function (value, key) {
            $scope.existingProductIDs.push(value["Item Number"]);
        });


        temp = temp.filter(function (item) {

            return $scope.existingProductIDs.indexOf(item["Item Number"]) !== -1;

        });

        $scope.currentExisitingProductData = temp;


    }


    $scope.loadMore = function () {
        if ($scope.scrollMode && $scope.data.length !== 0) {
            var temp = $scope.data.slice($scope.offset, $scope.offset + offset_increment);

            angular.forEach(temp, function (value, key) {
                $scope.currentData.push(value);
            });

            $scope.offset += offset_increment;
        }
    };

    $scope.loadMoreProducts = function () {
    	page = page + 1;
    	var results = getProducts(page);
    	
        if (results.length !== 0) {
            $scope.gridApi.infiniteScroll.saveScrollPercentage();
            $scope.products = $scope.products.concat(results);
            return $scope.gridApi.infiniteScroll.dataLoaded(false, true);
        }
    };

    $scope.loadClickedRecord = function (data) {

        if ($scope.form.edit) {
            //if we are in edit mode, don't allow changing of records
            return false;
        }

        $scope.loadSingleView(data);
        
    };
    

    $scope.loadSingleView = function (data) {
        if (data && data.entity) {
            $scope.form.master = data.entity;
            angular.copy($scope.form.master, $scope.form.user);
            $scope.view.record = data.entity;

            console.log($scope.form.user.added_category);
        }
        else {
            console.log("Data for single view not supplied.");
        }
    };

 

    $scope.editModeToggle = function () {
        $scope.view.existingRecord = true;
        //copy our master to our user editable object
        angular.copy($scope.form.master, $scope.form.user);

        //toggle our edit state to the reverse of whatever it was
        $scope.form.edit = !$scope.form.edit;
        $scope.form.new = false;

        

        //manage class for frontend styles
        if ($scope.form.edit == true) {
            $scope.form.activeclass = 'editing';
        }
        else {
            $scope.form.activeclass = '';
        }
    };

    $scope.addNewRecord = function () {
        $scope.form.user = {};
        $scope.form.user.item_number = "Please select";

        $scope.view.existingRecord = false;

        //toggle our edit state to the reverse of whatever it was
        $scope.form.edit = !$scope.form.edit;
        $scope.form.new = true;

        // setup Selects
        $(document).ready(function() {
             $('#relatedSKUs').select2({
                ajax: {
                    url: '/api/v1/products/lookup',
                    dataType: 'json',
                    processResults: function (data) {
                       return {
                         results: data
                       };
                     }
                },
                placeholder: 'Search for SKU',
                minimumInputLength: 3,
             }).on('change', function() {
                 var scope = angular.element($(this)).scope();
                 scope.$apply(function() {
                    scope.selectSKU($('#relatedSKUs').select2('val'));
                 });
             });
        });

        //manage class for frontend styles
        if ($scope.form.edit == true) {
            $scope.form.activeclass = 'editing';
        }
        else {
            $scope.form.activeclass = '';
        }

    };

    $scope.selectSKU = function(sku) {
        DS.getProductsBySKU(sku)
            .then(function(resp) {
                $scope.form.user = resp.data[0];
            });
    }



    $scope.updateAll = function() {
        for (var i = 0; i < $scope.products.length; i++) {
            var data = {
                id: $scope.products[i].id,
                featured_order: $scope.products[i].featured_order
            }
            DS.updateProduct(data);
        }
    }


    $scope.updateSingleProduct = function () {
        // JSONify our arrays
        $scope.form.user.species_id = JSON.stringify($scope.form.user.species_id);

        if ($scope.form.user.added_category && $scope.form.user.added_category.length == 0) {
            $scope.form.user.added_category = null;
        } else {
            $scope.form.user.added_category = JSON.stringify($scope.form.user.added_category);
        }

        if ($scope.form.user.related_skus && $scope.form.user.related_skus.length == 0) {
            $scope.form.user.related_skus = null;
        } else {
            $scope.form.user.related_skus = JSON.stringify($scope.form.user.related_skus);
        }

        // whenever we update a product, redo a full sync of it
        $scope.form.user.sync_to_woo = 1;

                DS.updateProduct($scope.form.user)
                    .then(updateSuccess, updateFailure)
                    .finally(function () {
                        console.log("finally");
                    });
        
        
    };


    function updateSuccess(response) {
        console.info("Update successful");
        console.log(response);

        let message = {
            id: Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36),
            text: '',
            type: 'success',
            platform: 'server'
        };

        //find out what kind of operation we were successful at
        if (response.config.url.indexOf('delete') >= 0) {
            message.text = 'Record deleted!';
            $scope.loadSingleView({record: {}});
        }
        else if (response.config.url.indexOf('new') >= 0) {
            message.text = 'Record created!';
            getProducts();
            $scope.loadSingleView({record: response.data.values});
        }
        else if (response.config.url.indexOf('update') >= 0) {
            message.text = 'Record updated!';
        	getProducts();
			$scope.loadSingleView({entity: response.data.values});
        }
        else {
            message.text = 'Success!';
            getProducts();
            $scope.loadSingleView({record: {}});
        }

        DS.wooFullSyncSingle($scope.form.user.item_number);

        $scope.editModeToggle();
        MS.addMessage(message);
    }

    function updateFailure(response) {

        var message = {
            id: Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36),
            text: 'Unable to complete operation.',
            type: 'warning',
            platform: 'server'
        };

        MS.addMessage(message);
        $scope.editModeToggle();
        getProducts();

    }

    $scope.unfeature = function(row, event) {
        event.preventDefault();
        event.stopPropagation();
        // todo: remove featured
        var data = {
            id: row.entity.id,
            featured_order: 100,
            is_featured: 0,
            has_date_range: 0,
            start_date: null,
            end_date: null
        }
        DS.updateProduct(data);

        getProducts();
    }

  


    $scope.loadDataSet = function (searchTerm) {

        var termLength = searchTerm.length;

        if (termLength == 0) {

            $scope.scrollMode = true;
            $scope.offset = 0;
            $scope.currentData = [];
            $scope.loadMore();

        }

        if (termLength >= 4) {

            $scope.scrollMode = false;

            if (stringIsNumber(searchTerm)) {

                DS.findProductsBySKU(searchTerm).then(processProducts);

            } else {
                let substring = "\'" + searchTerm + "\'";

                DS.getProductsBySearch(substring).then(processProducts);
            }


        } else {

            $scope.products = [];

        }

    };


}]);



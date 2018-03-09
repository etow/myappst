var App = {};

(function ($) {
    "use strict";

    var btnAdd ='#addItem',
        btnRemove = '.control.remove',
        btnEdit = '.control.edit',

        $counter = $('.counter'),

        $uploadForm = $('#upload-form'),
        $uploadFile = $('#upload-file'),
        $uploadPreview = $('#upload-preview'),
        $uploadDescription = $('#upload-description'),
        $uploadProgress = $('#upload-progress'),
        $uploadChars = $('#upload-chars'),

        $removeFile = $('#remove-file'),
        $removePreview = $('#remove-preview'),
        $removeDescription = $('#remove-description'),
        $removeSubmit = $('#remove-submit'),

        $pageHome = $('.page-'),
        $pageNew = $('.page-submit'),
        $pageEdit = $('.page-submit'),
        $pageRemove = $('.page-remove'),

        $appLoader = $('.loader'),
        $app = $('.app'),
        $appHeader = $('.app-header'),
        $appFooter = $('.app-footer'),
        $appBody = $('.app-body'),

        $list = $('.list'),
        
        CLOUDINARY_URL= ' https://api.cloudinary.com/v1_1/eliastorres',
        CLOUDINARY_PRESET = 'txlysz1z';
        

    App.data = {
        initialized: false,
        state : '',
        currentPage: '.page-',
        list:{},
        orderedList: {},
        listArray:[],
        orderedARray: [],
        currentOrder: -1
    };


    App.methods = {
        ui : {
            hideLoader : function () {
                /* When the application is ready, hide the Loader */
                $appLoader.fadeOut();
            },
            showLoader : function () {
                /* Display the charger until the data is loaded */
                $appLoader.fadeIn();
            },
            showEmpty: function () {
                /* When the list is empty, show a message and take the user to the "new" page */
                App.methods.ui.hideLoader();
                App.methods.ui.hideCounter();
                $pageNew.prepend($('#emptyTpl').html());
                $appFooter.css('visibility','hidden');
                page('/new');               
            },
            hideEmpty : function () {
                /* when the list have items, hide the Empty message */
                $pageNew.find('.form.empty').remove();
                $appFooter.css('visibility','visible');
            },
            showCounter : function () {
                $counter.show();
            },
            hideCounter : function () {
                $counter.hide();
            },
            updateCounter : function(){
                
                var number = Object.keys(App.data.list).length;
                if(number > 0){
                    var plural = number > 1 ? ' items' : ' item';
                    $counter.text( 'Tienes '+ number + plural);
                    App.methods.ui.showCounter();
                    App.methods.ui.hideEmpty();
                }else{
                    App.methods.ui.hideCounter();
                    App.methods.ui.showEmpty();
                    
                }
            },
            pageChanged : function (ev,state) {

                /* when a page changes, indicate which is the current page */

                $(App.data.currentPage).removeClass('is-active');
                App.data.state = state;

                switch (state) {
                    case 'new': {
                        $('.page-submit').addClass('is-active');
                        $(btnAdd).addClass("active");
                        App.data.currentPage = ".page-submit";
                        break;
                    };
                    case 'edit' : {

                        $('.page-submit').addClass('is-active')
                        $(btnAdd).addClass("active saved");
                        App.data.currentPage = ".page-submit";
                        break;
                    };
                    case 'remove' : {
                        $('.page-remove').addClass('is-active')
                        $(btnAdd).addClass("active");
                        App.data.currentPage = ".page-remove";
                        break;
                    };
                    default: {
                        $(btnAdd).removeClass("active saved");
                        
                        App.data.currentPage = ".page-";
                        $(App.data.currentPage).addClass('is-active');

                        /* when user returns to the home, check if any item has changed and update the list view */
                        if(App.data.itemStored){
                            App.methods.ui.updateListView();
                        }

                        /* reset some temporal data*/
                        App.methods.ui.resetFields();

                        break;
                    };
                }               
            },
            updateListView: function () {
                /* update listview when an item has changed */

                var id = App.data.itemStored.id;
                var item = App.data.list[id];


                switch(App.data.itemStored.action) {
                    case "added": { 
                        /* the renderData method is responsible for adding the item to the list */
                        App.methods.ui.renderData(id, item);
                        App.methods.services.save();
                        setTimeout(function(){
                            $list.find('#'+id).addClass('animate-in');
                        },200);
                        
                        break;
                    };
                    case "deleted" : {
                        /* when only an identification is passed, the renderData method removes the item from the list */
                        App.methods.ui.renderData(id);
                        App.methods.services.delete();
                        break;
                    };
                    case "updated" : {

                        var domItem =  $list.find('#'+id);

                        if(domItem.length > 0){
                            /* when an element is updated, 
                            passing the 3rd parameter as true only fires an animation on existing element */
                            domItem.replaceWith( App.methods.ui.renderData(id,item,true) );
                            App.methods.ui.bindAddRemove(id);
                            App.methods.services.update();
                        }else{
                            App.methods.ui.renderData(id, item);
                            App.methods.services.save();
                        }
                        setTimeout(function(){
                            $list.find('#'+id).addClass('animate-in');
                        },200);
                        break;
                    }
                }

                App.methods.ui.updateCounter();
                

            },
            resetFields : function () {
                $uploadForm.removeClass('has-file');
                $uploadDescription.val("");
                $uploadFile.wrap('<form>').closest('form').get(0).reset();
                $uploadFile.unwrap();
                $uploadPreview.css('background-image','none');
                $uploadChars.text("");
                App.data.itemStored = "";    
            },
            bindAddRemove : function (id) {
                $('#'+id).find(btnEdit).click(function(){
                    page("/edit/" + id );   
                });
                $('#'+id).find(btnRemove).click(function(){
                    page("/remove/" + id );
                });
            },
            setViewport: function () {
                var height = $app.height() - $appHeader.outerHeight() - $appFooter.outerHeight();
                $appBody.height(height);
            },
            renderData : function (id,item,ret) {
                /* if the item exists, add or update data */
                if(item){
                    var tpl = $('#listTpl').html();
                    tpl = tpl.replace(/{id}/g, id);
                    tpl = tpl.replace(/{img_url}/g, item.img_url);
                    tpl = tpl.replace(/{description}/g, item.description);

                    /* if ret is true, an animation is executed on the existing element,
                       if it is false, a new element is added */
                    if(ret){
                        return tpl;
                    }else{
                        $list.prepend(tpl);                       
                    }
                    App.methods.ui.bindAddRemove(id);
                }else{

                    $('#'+id).slideUp(function(){
                        $('#'+id).remove();
                    });
                }
    
            }
        },
        events : {
            watch : function (event) {
                $(document).on(event, App.methods.ui[event]);
            },
            trigger: function (event, state) {
                $(document).trigger(event, state);
            },
            uploadFile : function () {
                /* add event listener to load file button */
                $uploadFile.unsigned_cloudinary_upload(CLOUDINARY_PRESET, 
                    { tags:'app-excercise'},
                    {   
                        disableImageResize: false,
                        imageMaxWidth: 320,
                        imageMaxHeight: 320,
                        imageCrop: true,
                        acceptFileTypes: /(\.|\/)(gif|jpe?g|png|bmp|ico)$/i
                    }
                ).on('cloudinarydone', function(e, data){
                    App.methods.ui.hideEmpty();

                    $(App.data.currentPage).find('.page-progress').fadeOut();
                    
                    

                    if(App.data.state == "new"){

                        /* if the action to be performed is new, generate an id */

                        var id = Date.now();
                        var action ="added";
                    }

                    if(App.data.state == "edit"){
                        /* in case of updating an element, take the id of stored item */
                        var id = App.data.itemStored.id;
                        var action = "updated";
                    }

                    /* get image id from cloudinary and save it, so it can be erased in the future */
                    var img_id = data.result.public_id;
                    var img_url = $.cloudinary.url(data.result.public_id);
     
                    /* show image uploaded */
                    $uploadPreview.css('background-image', 'url('+img_url+')');
                    
                    /* once image is added, show description area by adding .has-file to parent form */
                    $uploadForm.addClass('has-file');
                    /*$uploadDescription.focus();*/
                    
                    /* save action affordance */                    
                    $(btnAdd).addClass('saved');

                    /* Save the new item in the list */
                    
                    App.data.list[id] = {
                        _id: id,
                        img_id : img_id,
                        img_url : img_url,
                        description : '',
                        order: App.data.currentOrder
                    };

                    App.data.currentOrder--;

                    /* Save a temporary reference of item to be used in renderView */
                    App.data.itemStored = {
                        id: id,
                        action : action
                    }

                    /* Save to database/localStorage actions are performed when the user returns to the home by clicking check button*/
                      
                })
                .on('cloudinaryprogress', function(e, data){ 
                    var W = Math.round((data.loaded * 100.0) / data.total);
                    $uploadProgress.css('width', W + '%');
                });
                                
            },
            descriptionInput : function () {

                $uploadDescription.on('keyup', function () {
                    App.data.list[App.data.itemStored.id].description = $uploadDescription.val();
                    App.data.itemStored.action = "updated";

                    if( $uploadDescription.val().length < 300){
                        $uploadChars.text("Caracteres restantes "+ ( 300 - $uploadDescription.val().length) )
                    }else{
                        $uploadChars.text("La descripción no puede superar los 300 caracteres");
                    }
                    
                });

            },
            newItem : function () {
                $(btnAdd).click(function () {
                    if(App.data.state == ""){
                        page('/new');
                    }else{
                        page('/');
                    }
                });
            },
            removeSubmit: function () {
                $removeSubmit.click(function(){
                    App.data.itemStored.action = "deleted"
                    page('/');
                });            
            }
        },
        services : {
            get: function () {
                var ref = localStorage.getItem('STList');
                
                if(ref){

                    App.data.list = JSON.parse(ref);
                    App.data.listArray = [];

                    $.each(App.data.list, function(){
                        App.data.listArray.push(this);
                    });
                    App.data.listArray.sort(function (a, b) {
                        return b.order - a.order;
                    });     
                                      
                }
 
                if( Object.keys(App.data.list).length > 0 ) { 
                    
                    App.methods.ui.hideLoader();

                    $.each(App.data.listArray, function(i,v){
                        App.methods.ui.renderData(v._id,v);
                    });

                    $list.find('li').each(function(i,e){
                        setTimeout(function(){
                            $(e).addClass('animate-in');
                        }, 200 * i);
                    });

                    App.methods.ui.updateCounter();

                    var sort = Sortable.create(document.getElementById('list'),{
                        animation: 150,
                        handle: '.handle',
                        touchStartThreshold: 3, 
                        onUpdate: function (evt){

                            var mappedItems = $( "#list li" ).map(function( index ) {
                                return $(this).attr('id');
                            });

                            $.each(mappedItems, function(i,v){
                                App.data.list[v].order = i;
                            });
                            
                            App.methods.services.updateReOrder();
                        }
                    });

                }else{
                    App.methods.ui.hideLoader();
                    App.methods.ui.showEmpty();
                }
                    
            },
            update : function () {

                localStorage.setItem("STList", JSON.stringify(App.data.list) );
            },
            updateReOrder : function (){
                App.methods.services.update();
            },
            save : function () {
                App.methods.services.update();
                
            },
            delete : function () {
                var id = App.data.itemStored.id;
                delete App.data.list[id];
                App.methods.services.update();
            }
        }
    }

    App.router  = function () {
        page('/', App.views.home);
        page('/new', App.views.new);
        page('/edit/:id', App.views.edit);
        page('/remove/:id', App.views.remove);
        page('*', App.views.home);

        page({
            hashbang:true
        });
        
    }

    App.views = {
        home : function () {
            App.methods.events.trigger('pageChanged','');
        },
        new : function () {
            App.methods.events.trigger('pageChanged','new');      
        },
        edit : function (ctx) {
            App.methods.events.trigger('pageChanged', 'edit');

            /* temporarily save the id, 
            and set action to updated */

            App.data.itemStored = {
                id: ctx.params.id,
                action:'updated'
            }

            var item = App.data.list[ctx.params.id];

            $uploadForm.addClass("has-file");

            if(item){
                $uploadPreview.css('background-image','url('+item.img_url+')');
                $uploadDescription.val(item.description);
            }

        },
        remove : function (ctx) {
            App.methods.events.trigger('pageChanged','remove');

            /* temporarily save the id, remove action would be added when user click submit button*/

            App.data.itemStored ={
                id:ctx.params.id
            } 
            var item = App.data.list[ctx.params.id];
            
            if(item){
                $removePreview.css('background-image','url('+ item.img_url +')');
                $removeDescription.text(item.description);
            }

        }
    };

    App.init = function () {
        /* set the size of the application so that it is always centered 
        and there are no scrollbars in body */

        App.methods.ui.setViewport();

        /* init page.js for routing */
        App.router();

        App.methods.events.watch('pageChanged');

        /* for this example, we will use cloudicnary to host image files */  
        $.cloudinary.config({ cloud_name:'eliastorres' });


        if(!App.data.initialized){
            App.methods.ui.showLoader();
            App.methods.services.get();
            App.data.initialized = true;
        }

        /* add event listeners */
        App.methods.events.uploadFile();
        App.methods.events.descriptionInput();
        App.methods.events.newItem();
        App.methods.events.removeSubmit();


        /* on resize, update viewport size*/

        var resizeTimer = null;

        $(window).resize(function(){
            clearTimeout(resizeTimer);

            resizeTimer = setTimeout(function(){
                App.methods.ui.setViewport();
            }, 100);

        });
                    
    }

    $(document).ready(App.init);

})(jQuery);
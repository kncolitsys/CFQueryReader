/*
 * Ext JS Library 2.1
 * Copyright(c) 2006-2008, Ext JS, LLC.
 * licensing@extjs.com
 * 
 * http://extjs.com/license
 */

Ext.onReady(function(){

    Ext.QuickTips.init();
    // Album toolbar
    var newIndex = 3;
    var tb = new Ext.Toolbar({
        items:[{
            text: 'New Album',
            iconCls: 'album-btn',
            handler: function(){
                var node = root.appendChild(new Ext.tree.TreeNode({
                    text:'Album ' + (++newIndex),
                    cls:'album-node',
                    allowDrag:false
                }));
                tree.getSelectionModel().select(node);
                setTimeout(function(){
                    ge.editNode = node;
                    ge.startEdit(node.ui.textNode);
                }, 10);
            }
        }]
    });

    // set up the Album tree
    var tree = new Ext.tree.TreePanel({
         // tree
         animate:true,
         enableDD:true,
         containerScroll: true,
         ddGroup: 'organizerDD',
         rootVisible:false,
         // layout
         region:'west',
         width:200,
         split:true,
         // panel
         title:'My Albums',
         autoScroll:true,
         tbar: tb,
         margins: '5 0 5 5'
    });

    var root = new Ext.tree.TreeNode({
        text: 'Albums',
        allowDrag:false,
        allowDrop:false
    });
    tree.setRootNode(root);

    root.appendChild(
        new Ext.tree.TreeNode({text:'Album 1', cls:'album-node', allowDrag:false}),
        new Ext.tree.TreeNode({text:'Album 2', cls:'album-node', allowDrag:false}),
        new Ext.tree.TreeNode({text:'Album 3', cls:'album-node', allowDrag:false})
    );

    // add an inline editor for the nodes
    var ge = new Ext.tree.TreeEditor(tree, {
        allowBlank:false,
        blankText:'A name is required',
        selectOnFocus:true
    });
    
    var myDataModel = [
    	{name: 'ID', mapping: 'ID', type: 'int'},
        {name: 'name', mapping: 'NAME', type:'string'},
        {name: 'size', mapping: 'SIZE', type:'int'},
        {name: 'dir', mapping: 'DIRECTORY', type:'string'},
        {name: 'type', mapping: 'TYPE', type: 'string'},
        {name: 'mode', mapping: 'MODE', type: 'string'},
        {name: 'attr', mapping: 'ATTRIBUTES', type: 'string'},
        {name: 'modified', mapping: 'DATELASTMODIFIED', type: 'string'}
        ];

    var myCFReader =  new Ext.data.CFJsonReader(myDataModel,{id:'ID'});
    
    var ds = new Ext.data.Store({
            url: '/com/cc/ImageTest.cfc',
            baseParams:{
            	method: 'GetFiles',
            	returnFormat: 'JSON'
            },
            reader: myCFReader,
            root:'QUERY',
            listeners: {
                loadexception: function(proxy, store, response, e) {
                    //console.log("Response Text?"+response.responseText);
                    //console.log("dgStore Message \n"+proxy+"\n"+store+"\n"+response+"\n"+e.message);
                },
                load: function(){
                    //console.log('load Worked!');
                }
            }
    });
    ds.load();
    console.log(ds);

    // Set up images view

    var view = new Ext.DataView({
        itemSelector: 'div.thumb-wrap',
        style:'overflow:auto',
        multiSelect: true,
        plugins: new Ext.DataView.DragSelector({dragSafe:true}),
        store: ds,
        tpl: new Ext.XTemplate(
            '<tpl for=".">',
            '<div class="thumb-wrap" id="{ID}">',
            '<div class="thumb"><img src="../view/{NAME}" class="thumb-img"></div>',
            '<span>{NAME}</span></div>',
            '</tpl>'
        )
    });

    var images = new Ext.Panel({
        id:'images',
        title:'My Images',
        region:'center',
        margins: '5 5 5 0',
        layout:'fit',
        
        items: view
    });

    var layout = new Ext.Panel({
        layout: 'border',
        width:650,
        height:400,
        items: [tree, images]
    });

    layout.render('layout');

    var dragZone = new ImageDragZone(view, {containerScroll:true,
        ddGroup: 'organizerDD'});
        
    //tree.on('append',function(tree,parent,node,index){
    //	console.log(index);
    //});
});



/**
 * Create a DragZone instance for our JsonView
 */
ImageDragZone = function(view, config){
    this.view = view;
    ImageDragZone.superclass.constructor.call(this, view.getEl(), config);
};
Ext.extend(ImageDragZone, Ext.dd.DragZone, {
    // We don't want to register our image elements, so let's 
    // override the default registry lookup to fetch the image 
    // from the event instead
    getDragData : function(e){
        var target = e.getTarget('.thumb-wrap');
        if(target){
            var view = this.view;
            if(!view.isSelected(target)){
                view.onClick(e);
            }
            var selNodes = view.getSelectedNodes();
            var dragData = {
                nodes: selNodes
            };
            if(selNodes.length == 1){
                dragData.ddel = target.firstChild.firstChild; // the img element
                dragData.single = true;
            }else{
                var div = document.createElement('div'); // create the multi element drag "ghost"
                div.className = 'multi-proxy';
                for(var i = 0, len = selNodes.length; i < len; i++){
                    div.appendChild(selNodes[i].firstChild.firstChild.cloneNode(true));
                    if((i+1) % 3 == 0){
                        div.appendChild(document.createElement('br'));
                    }
                }
                dragData.ddel = div;
                dragData.multi = true;
            }
            return dragData;
        }
        return false;
    },

    // this method is called by the TreeDropZone after a node drop
    // to get the new tree node (there are also other way, but this is easiest)
    getTreeNode : function(){
        var treeNodes = [];
        var nodeData = this.view.getRecords(this.dragData.nodes);
        for(var i = 0, len = nodeData.length; i < len; i++){
            var data = nodeData[i].data;
            treeNodes.push(new Ext.tree.TreeNode({
                text: data.NAME,
                icon: '../view/'+data.NAME,
                data: data,
                leaf:true,
                cls: 'image-node'
            }));
        }
        console.log(treeNodes);
        return treeNodes;
    },
    
    // the default action is to "highlight" after a bad drop
    // but since an image can't be highlighted, let's frame it 
    afterRepair:function(){
        for(var i = 0, len = this.dragData.nodes.length; i < len; i++){
            Ext.fly(this.dragData.nodes[i]).frame('#8db2e3', 1);
        }
        this.dragging = false;    
    },
    
    // override the default repairXY with one offset for the margins and padding
    getRepairXY : function(e){
        if(!this.dragData.multi){
            var xy = Ext.Element.fly(this.dragData.ddel).getXY();
            xy[0]+=3;xy[1]+=3;
            return xy;
        }
        return false;
    }
});

// Utility functions

function shortName(name){
    console.log(arguments);
    if(name.length > 15){
        return name.substr(0, 12) + '...';
    }
    return name;
};

function makeID(name){
	console.log(name.replace(/.JPG/,''));
	return name.replace(/.JPG/,'');
}
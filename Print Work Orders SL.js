/**
    *@NApiVersion 2.1
    *@NScriptType Suitelet 
*/

define(["N/ui/serverWidget", "N/search", "N/record", "N/format", "N/ui/dialog", "N/runtime", "N/redirect", "N/task"], function (serverWidget, search, record, format, dialog, runtime, redirect, task) {
    function onRequest(context) {

        try {

            var request = context.request;
            var response = context.response;
            var scriptObject = runtime.getCurrentScript();

            var fromdate_cl;
            var todate_cl;
            var workorder_cl;
            var assemblyItem_cl;
            var client_cl;
            var produccion_cl;
            var color_cl;
            var page;

            if (request.method == 'GET') {


                //Creating Form
                var form = serverWidget.createForm({
                    title: 'Print Work Orders'
                });

                form.clientScriptModulePath = './Print Work Orders CS.js';

                //Date Range Filter
                var fromDate = form.addField({
                    id: 'custpage_fromdate',
                    label: 'From Date',
                    type: serverWidget.FieldType.DATE
                });

                var toDate = form.addField({
                    id: 'custpage_todate',
                    label: 'To Date',
                    type: serverWidget.FieldType.DATE
                });

                //Work Order Number Filter
                var workOrder = form.addField({
                    id: 'custpage_workorder',
                    label: 'Work Order',
                    type: serverWidget.FieldType.SELECT,
                    source: 'workorder'
                });

                //Assembly Item Filter
                var assemblyItem = form.addField({
                    id: 'custpage_assemblyitem',
                    label: 'Assembly Item',
                    type: serverWidget.FieldType.SELECT,
                    source: 'item'
                });

                //Client Filter
                var client = form.addField({
                    id: 'custpage_client',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Client',
                    source: 'customer'
                });

                //Semana de producción Filter
                var produccion = form.addField({
                    id: 'custpage_produccion',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Semana de producción'
                });

                //PRODUCCIÓN: COLOR Filter
                var color = form.addField({
                    id: 'custpage_color',
                    type: serverWidget.FieldType.TEXT,
                    label: 'PRODUCCIÓN: COLOR'
                });

                form.addSubtab({id:"custpage_wo_tab",label:"Work Orders"});
                form.addFieldGroup({id:"custpage_wo_fg",tab:"custpage_wo_tab",label:"Work Orders"});
                var pageSel = form.addField({
                    id: 'custpage_select_range',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Select Page',
                    container: 'custpage_wo_fg'
                });

                //ADD SUBLIST ON THE FORM
                var sublist = form.addSublist({
                    id: 'custpage_sublist_main',
                    type: serverWidget.SublistType.LIST,
                    label: 'Work Orders',
                    tab:'custpage_wo_tab'
                });

                //Select Checkbox
                sublist.addField({
                    id: 'custpage_sublist_checkbox',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Select'
                });

                //Date Details
                sublist.addField({
                    id: 'custpage_sublist_date',
                    type: serverWidget.FieldType.DATE,
                    label: 'Date'
                });

                //Work Order Details
                var workOrderDetails = sublist.addField({
                    id: 'custpage_sublist_workorder',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Work Order',
                    source: 'workorder'
                });
                workOrderDetails.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });

                //Assembly Item Details
                var assemblyItemDetails = sublist.addField({
                    id: 'custpage_sublist_assembly_item',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Assembly Item',
                    source: 'item'
                });
                assemblyItemDetails.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });

                //Client Details
                var clientDetails = sublist.addField({
                    id: 'custpage_sublist_client',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Client',
                    source: 'customer'
                });
                clientDetails.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });

                //Semana de producción
                sublist.addField({
                    id: 'custpage_sublist_produccion',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Semana de producción'
                });

                //PRODUCCIÓN: COLOR
                sublist.addField({
                    id: 'custpage_sublist_color',
                    type: serverWidget.FieldType.TEXT,
                    label: 'PRODUCCIÓN: COLOR'
                });

                //Print BOM 
                sublist.addField({
                    id: 'custpage_sublist_print_bom',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'Print BOM'
                });

                //Print Traveler
                sublist.addField({
                    id: 'custpage_sublist_print_traveler',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'Print Production Traveler'
                });

                // if (!fromdate_cl && !todate_cl && !workorder_cl && !assemblyItem_cl && !client_cl) {
                //     var searchResult = getWorkOrderDetails(fromdate_cl, todate_cl, workorder_cl, assemblyItem_cl, client_cl);
                //     if (searchResult) {
                //         addValuestoSublist(searchResult, sublist);
                //     }
                // }

                //Fetching URL Parameters
                fromdate_cl = request.parameters.fromdate_cs;
                todate_cl = request.parameters.todate_cs;
                workorder_cl = request.parameters.workorder_cs;
                assemblyItem_cl = request.parameters.assemblyitem_cs;
                client_cl = request.parameters.client_cs;
                produccion_cl = request.parameters.produccion_cs;
                color_cl = request.parameters.color_cs;
                page = request.parameters.page;

               log.debug("page",page);

                // if (fromdate_cl || todate_cl || workorder_cl || assemblyItem_cl || client_cl) {

                //Setting default values
                fromDate.defaultValue = fromdate_cl;
                toDate.defaultValue = todate_cl;
                workOrder.defaultValue = workorder_cl;
                assemblyItem.defaultValue = assemblyItem_cl;
                client.defaultValue = client_cl;
                produccion.defaultValue = produccion_cl;
                color.defaultValue = color_cl;
               // pageSel.defaultValue = pageSel

                sublist.addMarkAllButtons();

              /*  sublist.addButton({
                    id: 'custpage_sublist_print_bom',
                    label: 'Print BOM',
                    functionName: 'printBom()'
                });

                sublist.addButton({
                    id: 'custpage_sublist_print_traveler',
                    label: 'Print Production Traveler',
                    functionName: 'printProductionTraveler()'
                });*/

                var searchResult = getWorkOrderDetails(fromdate_cl, todate_cl, workorder_cl, assemblyItem_cl, client_cl, produccion_cl, color_cl, page, form);
                log.debug('Search Result', searchResult);
                if (searchResult) {
                    addValuestoSublist(searchResult, sublist);
                }
                //}

                // form.addSubmitButton({
                //     label: 'Submit'
                // });

                form.addButton({
                    id: 'filterButton',
                    label: 'Filter',
                    functionName: 'filterButton()'
                });

                form.addButton({
                    id: 'printBomButton',
                    label: 'Print BOM',
                    functionName: 'printBom()' //'printBomButton()'
                });

                form.addButton({
                    id: 'printProdTraveler',
                    label: 'Print Production Traveler',
                    functionName:  'printProductionTraveler()' //'printProdTraveler()'
                });

                response.writePage(form);

            } else {
                //POST Method
                var reference = context.request.parameters.ref;
                if (reference == "Process") {
                    processData(context);
                }

                if (reference == "checkStatus") {
                    checkMPRDStatus(context);
                }
            }

        } catch (e) {
            log.error('Error in script', e.message);
        }
    }

    function getWorkOrderDetails(fromdate, todate, workorder, assemblyItem, client, produccion, color, page, form) {

        try {
            var pageNum = page?page:0;
           var startIndex = pageNum * 80;
           var endIndex = startIndex + 80;
            log.debug("startIndex",startIndex);
            log.debug("endIndex",endIndex);
            log.debug('In getWorkOrderDetails', 'fromdate - ' + fromdate + 'To date - ' + todate + "Work Order - " + workorder + 'Assembly Item - ' + assemblyItem);

            //Loading the search
            var workOrder_ss = search.load({
                id: 'customsearch_work_orders'
            });
            log.debug('Saved search', workOrder_ss);

            //Filters
            var filters = workOrder_ss.filters;

            //Date Filters
            if (fromdate && todate) {
                //log.debug('Both dates present');
                var filterfromtodate = search.createFilter({ name: "trandate", operator: search.Operator.WITHIN, values: [fromdate, todate] });
                filters.push(filterfromtodate);
            } else if (fromdate) {
                //log.debug('From dates present');
                var filterfromdate = search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: fromdate });
                filters.push(filterfromdate);
            } else if (todate) {
                //log.debug('To dates present');
                var filtertodate = search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: todate });
                filters.push(filtertodate);
            }

            //Workorder Filter
            if (workorder) {
                var filterWorkOrder = search.createFilter({ name: "internalid", operator: search.Operator.ANYOF, values: workorder });
                filters.push(filterWorkOrder);
            }

            //Assembly Item Filter
            if (assemblyItem) {
                var filterAssemblyItem = search.createFilter({ name: "item", operator: search.Operator.ANYOF, values: assemblyItem });
                filters.push(filterAssemblyItem);
            }

            //Semana de producción
            if(produccion) {
                var filterProduccion = search.createFilter({ name: "custbody_tko_semana_produccion", operator: search.Operator.IS, values: produccion });
                filters.push(filterProduccion);
            }

            //PRODUCCIÓN: COLOR Filter
            if(color) {
                var filtercolor = search.createFilter({ name: "custbodysmg_colorproduccion", operator: search.Operator.IS, values: color });
                filters.push(filtercolor);
            }

            log.debug('Filters', filters);
            //Client Filter
            //TO-DO

            var searchResultCount = workOrder_ss.runPaged().count;
            log.debug('searchResultCount', searchResultCount);
            const totalPages = Math.ceil(searchResultCount / 80);
          log.debug('totalPages', totalPages);
    const selectField = form.getField({ id: "custpage_select_range" });
    
    for (let i = 0, cnt = 1; i < totalPages; i++, cnt++) {
        const flag = (i == pageNum); // Select the first option by default
      log.debug('flag', flag);
        selectField.addSelectOption({
            value: i,
            text: 'Page ' + cnt,
            isSelected: flag
        });
    }
            var searchResult = workOrder_ss.run().getRange({
                start: startIndex,
                end: endIndex
            });

            // workOrder_ss.run().each(function(result){
            //     // .run().each has a limit of 4,000 results
            //     searchResult.push(result);
            //     return true;
            // });
            // log.debug('Search Result',searchResult);

            return searchResult;

        } catch (e) {
            log.error('Error in function getWorkOrderDetails', e.message);
        }

    }

    function addValuestoSublist(searchResult, sublist) {

        try {

            var jsonObject = [];

            for (var j = 0; j < searchResult.length; j++) {

                var date = searchResult[j].getValue('trandate');
                var workOrder = searchResult[j].getValue('internalid');
                var assemblyItem = searchResult[j].getValue('item');
                var produccion = searchResult[j].getValue('custbody_tko_semana_produccion');
                var color = searchResult[j].getValue('custbodysmg_colorproduccion');

                var workOrderData = {
                    'Date': date,
                    'WorkOrder': workOrder,
                    'AssemblyItem': assemblyItem,
                    'produccion': produccion,
                    'color': color
                }

                jsonObject.push(workOrderData);
            }
            log.debug('JSON Object', jsonObject);

            for (var k = 0; k < jsonObject.length; k++) {

                //sublist.setSublistValue({ id: 'custpage_sublist_checkbox', line: k, value: 'T' });

                if (jsonObject[k].Date) {
                    sublist.setSublistValue({ id: 'custpage_sublist_date', line: k, value: jsonObject[k].Date });
                }

                if (jsonObject[k].WorkOrder) {
                    sublist.setSublistValue({ id: 'custpage_sublist_workorder', line: k, value: jsonObject[k].WorkOrder });
                }

                if (jsonObject[k].AssemblyItem) {
                    sublist.setSublistValue({ id: 'custpage_sublist_assembly_item', line: k, value: jsonObject[k].AssemblyItem });
                }

                if (jsonObject[k].produccion) {
                    sublist.setSublistValue({ id: 'custpage_sublist_produccion', line: k, value: jsonObject[k].produccion });
                }

                if (jsonObject[k].color) {
                    sublist.setSublistValue({ id: 'custpage_sublist_color', line: k, value: jsonObject[k].color });
                }

                var bomLink = "https://8333310.app.netsuite.com/app/accounting/print/hotprint.nl?regular=T&sethotprinter=T&formnumber=451&trantype=workord&&id=" + jsonObject[k].WorkOrder + "&label=Bill+of+Materials&printtype=bom";
                var htmlBOMLink = '<html>'
                htmlBOMLink += '<body>'
                htmlBOMLink += '<p><a href=' + bomLink + ' target="_blank" download>Print BOM</a></p>'
                htmlBOMLink += '</body>'
                htmlBOMLink += '</html>'


                sublist.setSublistValue({ id: 'custpage_sublist_print_bom', line: k, value: htmlBOMLink });

                var travelerLink = "https://8333310.app.netsuite.com/app/site/hosting/scriptlet.nl?script=3394&deploy=1&compid=8333310&templateID=137&typeRecord=workorder&recordID=" + jsonObject[k].WorkOrder + "&savedSearch=customsearch_tkiio_dataot_pdf_viajerofab&requiredSearch=false"
                var travelerHTML = '<html>'
                travelerHTML += '<body>'
                travelerHTML += '<p><a href=' + travelerLink + ' target="_blank" download>Print Production Traveler</a></p>'
                travelerHTML += '</body>'
                travelerHTML += '</html>'

                sublist.setSublistValue({ id: 'custpage_sublist_print_traveler', line: k, value: travelerHTML });
            }

        } catch (e) {
            log.error('Error in function addValuestoSublist', e.message);
        }
    }

    function processData(context) {
        var data = context.request.parameters.data
        //var batchid = context.request.parameters.batch;
        var printType = context.request.parameters.type;
        log.debug("data", data);
        log.debug("printType", printType);
         //log.debug("batchid", batchid);
        
        var mapParam = {};
        var taskObj = {};
        var custRec = record.create({type:"customrecord_pl_woprintlist"});
        //custRec.setValue({fieldId:"custrecord_pl_processedord",value:data});
        var custRecid = custRec.save();
        mapParam["custscript_processed_wo_data1"] = data
        mapParam["custscript_batchid1"] = custRecid
        //mapParam["custscript_wofolder"] = folderId
        var myTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: 'customscript_sch_processwofiles',//'customscript_mprd_wo_pdf',
            deploymentId: 'customdeploy_mprd_wo_pdf_' + printType,
            params: mapParam
        });

        var taskId = myTask.submit();
        taskObj["taskId"] = taskId;
        taskObj["batchid"] = custRecid;
        context.response.write(JSON.stringify(taskObj));

    }

    function checkMPRDStatus(context) {
        var myTaskId = context.request.parameters.taskId;
        var myTaskStatus = task.checkStatus({
            taskId: myTaskId
        });
     //   var mapActualCount = myTaskStatus.getTotalReduceCount();
      //  var maptobeProcessedCount = myTaskStatus.getPendingReduceCount();//myTaskStatus.getPendingMapCount();
      //  var processedCount = myTaskStatus.getTotalOutputCount();//mapActualCount - maptobeProcessedCount;
        var maprdStatus = myTaskStatus.status;
      //  var completion = myTaskStatus.getPercentageCompleted();
        var mapredObj = {};
   //     mapredObj["actual"] = mapActualCount;
   //     mapredObj['processed'] = processedCount;
     //   mapredObj['remaining'] = maptobeProcessedCount;
        mapredObj['status'] = maprdStatus;
    //    mapredObj['percentage'] = completion;
        context.response.write(JSON.stringify(mapredObj));
    }

    return {
        onRequest: onRequest
    }
});
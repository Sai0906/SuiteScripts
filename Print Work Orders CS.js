/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@NModuleScope Public
 */

define(["N/currentRecord", "N/url", "N/ui/dialog", "N/format", "N/https", "N/ui/message", "N/search"], function (currentRecord, url, dialog, format, https, message, search) {

    var record = currentRecord.get();
    var isProcessing = false; // Global flag to prevent multiple clicks
    var currentTaskId = null; // Track current task ID
    var currentPollingInterval = null; // Track polling interval
    var isPageChangeInProgress = false; // flag to prevent multiple page changes
    var currentPage;

    function pageInit(context){
        try {
            currRec = context.currentRecord;
            currentPage = currRec.getValue('custpage_select_range');
            //alert('currentPage == '+currentPage)
        } catch (e) {
            console.error('Error in print traveler', e.message);
        }
    }

    function fieldChanged(context) {
        var fieldId = context.fieldId;

        if (fieldId === "custpage_select_range" /* && isProcessing === false */) {
            // When page selection changes, load that page automatically
            loadSelectedPage();
        } else {
            //context.currentRecord.setValue('custpage_select_range', currentPage);
            // Prevent multiple clicks
            dialog.alert({
                title: "Processing",
                message: "Please wait for the current operation to complete."
            });
            return false;
        }
    }

    function loadSelectedPage() {
        if (isPageChangeInProgress) {
            return; // Prevent multiple rapid page changes
        }

        try {
            isPageChangeInProgress = true;

            var fromdate_value = record.getValue('custpage_fromdate');
            var todate_value = record.getValue('custpage_todate');
            var workorder_value = record.getValue('custpage_workorder');
            var assemblyitem_value = record.getValue('custpage_assemblyitem');
            var client_value = record.getValue('custpage_client');
            var produccion_value = record.getValue('custpage_produccion');
            var color_value = record.getValue('custpage_color');
            var pageVal = record.getValue('custpage_select_range');

            // Format dates if they exist
            var typecast_fromdate = '';
            if (fromdate_value) {
                typecast_fromdate = format.format({
                    value: fromdate_value,
                    type: format.Type.DATE
                });
            }

            var typecast_todate = '';
            if (todate_value) {
                typecast_todate = format.format({
                    value: todate_value,
                    type: format.Type.DATE
                });
            }

            window.onbeforeunload = null;

            var suiteletURL = url.resolveScript({
                scriptId: 'customscript_sl_print_work_orders',
                deploymentId: 'customdeploy_sl_print_work_orders',
                params: {
                    fromdate_cs: typecast_fromdate,
                    todate_cs: typecast_todate,
                    workorder_cs: workorder_value,
                    assemblyitem_cs: assemblyitem_value,
                    client_cs: client_value,
                    produccion_cs: produccion_value,
                    color_cs: color_value,
                    page: pageVal,
                    auto_page_change: 'true'  // Add flag to indicate this is an auto page change
                }
            });

            // Show loading indicator
            showLoadingIndicator(true);

            // Navigate to the new page
            window.open(suiteletURL, '_self', false);

        } catch (e) {
            console.error('Error in loadSelectedPage:', e.message);
            isPageChangeInProgress = false;
        }
    }

    function showLoadingIndicator(show) {
        try {
            if (show) {
                // Create and show loading overlay
                var overlay = document.createElement('div');
                overlay.id = 'pageLoadingOverlay';
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                overlay.style.zIndex = '9999';
                overlay.style.display = 'flex';
                overlay.style.justifyContent = 'center';
                overlay.style.alignItems = 'center';

                var spinner = document.createElement('div');
                spinner.innerHTML = `
                    <div style="text-align: center;">
                        <div style="border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                        <p style="margin-top: 20px; color: #333; font-weight: bold;">Loading page...</p>
                    </div>
                `;

                var style = document.createElement('style');
                style.innerHTML = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;

                overlay.appendChild(style);
                overlay.appendChild(spinner);
                document.body.appendChild(overlay);
            } else {
                // Remove loading overlay if it exists
                var overlay = document.getElementById('pageLoadingOverlay');
                if (overlay) {
                    document.body.removeChild(overlay);
                }
            }
        } catch (e) {
            console.error('Error showing loading indicator:', e);
        }
    }

    function filterButton() {
        var fromdate_value = record.getValue('custpage_fromdate');
        var todate_value = record.getValue('custpage_todate');

        if (fromdate_value) {
            var typecast_fromdate = format.format({
                value: fromdate_value,
                type: format.Type.DATE
            });
        } else {
            typecast_fromdate = '';
        }

        if (todate_value) {
            var typecast_todate = format.format({
                value: todate_value,
                type: format.Type.DATE
            });
        } else {
            typecast_todate = '';
        }

        var workorder_value = record.getValue('custpage_workorder');
        var assemblyitem_value = record.getValue('custpage_assemblyitem');
        var client_value = record.getValue('custpage_client');
        var produccion_value = record.getValue('custpage_produccion');
        var color_value = record.getValue('custpage_color');
        var pageVal = record.getValue('custpage_select_range');

        window.onbeforeunload = null;

        var suiteletURL = url.resolveScript({
            scriptId: 'customscript_sl_print_work_orders',
            deploymentId: 'customdeploy_sl_print_work_orders',
            params: {
                fromdate_cs: typecast_fromdate,
                todate_cs: typecast_todate,
                workorder_cs: workorder_value,
                assemblyitem_cs: assemblyitem_value,
                client_cs: client_value,
                produccion_cs: produccion_value,
                color_cs: color_value,
                page: pageVal
            }
        });
        window.open(suiteletURL, '_self', false);
    }

    function printBom() {
        if (isProcessing) {
            dialog.alert({
                title: "Processing",
                message: "Please wait for the current operation to complete."
            });
            return false;
        }

        try {
            isProcessing = true;
            disablePrintButtons(true);

            var workOrderIDs = [];
            var numLines = record.getLineCount({
                sublistId: 'custpage_sublist_main'
            });

            for (var j = 0; j < numLines; j++) {
                var checkboxvalue = record.getSublistValue({
                    sublistId: 'custpage_sublist_main',
                    fieldId: 'custpage_sublist_checkbox',
                    line: j
                });

                if (checkboxvalue == true) {
                    var workOrder = record.getSublistValue({
                        sublistId: 'custpage_sublist_main',
                        fieldId: 'custpage_sublist_workorder',
                        line: j
                    });
                    workOrderIDs.push(workOrder);
                }
            }

            if (workOrderIDs.length === 0) {
                dialog.alert({
                    title: "No Selection",
                    message: "Please select at least one Work Order to print BOM."
                });
                isProcessing = false;
                disablePrintButtons(false);
                return false;
            }

            window.onbeforeunload = null;
            var suiteletURL = url.resolveScript({
                scriptId: 'customscript_sl_print_work_orders',
                deploymentId: 'customdeploy_sl_print_work_orders',
            });

            var totalCnt = workOrderIDs.length;
            var response = https.post({
                url: suiteletURL,
                body: {
                    "ref": "Process",
                    "data": JSON.stringify({
                        "data": workOrderIDs
                    }),
                    "type": "bom"
                }
            });

            console.log("response " + response);
            console.log("response " + response.body);

            try {
                var mprdTaskObj = JSON.parse(response.body);
                var mprdTaskId = mprdTaskObj.taskId;
                var batchCount = mprdTaskObj.batchid;

                if (mprdTaskId) {
                    // Clear any existing polling
                    if (currentPollingInterval) {
                        clearTimeout(currentPollingInterval);
                        currentPollingInterval = null;
                    }

                    currentTaskId = mprdTaskId;
                    startTime(mprdTaskId, suiteletURL, totalCnt, "bom", batchCount);
                } else {
                    throw new Error("No task ID returned");
                }
            } catch (parseError) {
                console.error("Error parsing response:", parseError);
                dialog.alert({
                    title: "Error",
                    message: "Failed to process request. Please try again."
                });
                isProcessing = false;
                disablePrintButtons(false);
            }

            console.log('Work orders', workOrderIDs);

        } catch (e) {
            console.error('Error in print bom', e.message);
            dialog.alert({
                title: "Error",
                message: "An error occurred: " + e.message
            });
            isProcessing = false;
            disablePrintButtons(false);
        }
    }

    function printProductionTraveler() {
        if (isProcessing) {
            dialog.alert({
                title: "Processing",
                message: "Please wait for the current operation to complete."
            });
            return false;
        }

        try {
            isProcessing = true;
            disablePrintButtons(true);

            var workOrderIDs = [];
            var numLines = record.getLineCount({
                sublistId: 'custpage_sublist_main'
            });

            for (var j = 0; j < numLines; j++) {
                var checkboxvalue = record.getSublistValue({
                    sublistId: 'custpage_sublist_main',
                    fieldId: 'custpage_sublist_checkbox',
                    line: j
                });

                if (checkboxvalue == true) {
                    var workOrder = record.getSublistValue({
                        sublistId: 'custpage_sublist_main',
                        fieldId: 'custpage_sublist_workorder',
                        line: j
                    });
                    workOrderIDs.push(workOrder);
                }
            }

            if (workOrderIDs.length === 0) {
                dialog.alert({
                    title: "No Selection",
                    message: "Please select at least one Work Order to Proceed."
                });
                isProcessing = false;
                disablePrintButtons(false);
                return false;
            }

            window.onbeforeunload = null;
            var suiteletURL = url.resolveScript({
                scriptId: 'customscript_sl_print_work_orders',
                deploymentId: 'customdeploy_sl_print_work_orders',
            });

            var totalCnt = workOrderIDs.length;
            var response = https.post({
                url: suiteletURL,
                body: {
                    "ref": "Process",
                    "data": JSON.stringify({
                        "data": workOrderIDs
                    }),
                    "type": "pdf"
                }
            });

            console.log("response " + response);
            console.log("response " + response.body);

            try {
                var mprdTaskObj = JSON.parse(response.body);
                var mprdTaskId = mprdTaskObj.taskId;
                var batchCount = mprdTaskObj.batchid;

                if (mprdTaskId) {
                    // Clear any existing polling
                    if (currentPollingInterval) {
                        clearTimeout(currentPollingInterval);
                        currentPollingInterval = null;
                    }

                    currentTaskId = mprdTaskId;
                    startTime(mprdTaskId, suiteletURL, totalCnt, "pdf", batchCount);
                } else {
                    throw new Error("No task ID returned");
                }
            } catch (parseError) {
                console.error("Error parsing response:", parseError);
                dialog.alert({
                    title: "Error",
                    message: "Failed to submit job request, Old job is INPROGRESS.. Please try again."
                });
                isProcessing = false;
                disablePrintButtons(false);
            }

            console.log('Work orders', workOrderIDs);

        } catch (e) {
            console.error('Error in print traveler', e.message);
            dialog.alert({
                title: "Error",
                message: "An error occurred: " + e.message
            });
            isProcessing = false;
            disablePrintButtons(false);
        }
    }

    function disablePrintButtons(disabled) {
        try {
            // Disable/enable the print buttons
            var printBomBtn = document.querySelector('button[id="printBomButton"]');
            var printTravelerBtn = document.querySelector('button[id="printProdTraveler"]');

            if (printBomBtn) {
                printBomBtn.disabled = disabled;
                printBomBtn.style.opacity = disabled ? "0.5" : "1";
                printBomBtn.style.cursor = disabled ? "not-allowed" : "pointer";
            }

            if (printTravelerBtn) {
                printTravelerBtn.disabled = disabled;
                printTravelerBtn.style.opacity = disabled ? "0.5" : "1";
                printTravelerBtn.style.cursor = disabled ? "not-allowed" : "pointer";
            }
        } catch (e) {
            console.error("Error disabling buttons:", e);
        }
    }

    function startTime(mprdTaskId, outputURL, size, printT, batchCount) {
        // If this is not the current task, stop polling
        if (mprdTaskId !== currentTaskId) {
            return;
        }

        var taskObj = {
            "ref": "checkStatus",
            "taskId": mprdTaskId
        };

        console.log("Polling task status:", taskObj);

        var headerObj = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        try {
            var response = https.post({
                url: outputURL,
                headers: headerObj,
                body: taskObj
            });

            var mprdresp = JSON.parse(response.body);
            var mprdstatus = mprdresp.status;
            console.log("Task status:", mprdstatus);

            if (mprdstatus == "PROCESSING" || mprdstatus == "PENDING") {
                // Show message only once
                if (!document.querySelector('.processing-message')) {
                    var myMsg = message.create({
                        title: "Processing",
                        message: "Please wait while records are being processed...",
                        type: message.Type.INFORMATION
                    });
                    myMsg.show({
                        duration: 2000
                    });

                    // Add a marker to prevent duplicate messages
                    var script = document.createElement('script');
                    script.innerHTML = 'document.processingMessageShown = true;';
                    document.head.appendChild(script);
                }

                // Continue polling
                currentPollingInterval = setTimeout(function () {
                    startTime(mprdTaskId, outputURL, size, printT, batchCount);
                }, 2000);

            } else if (mprdstatus == "FAILED") {
                var myMsg = message.create({
                    title: "Processing Failed",
                    message: "Failed to process the request. Please contact Administrator.",
                    type: message.Type.ERROR
                });
                myMsg.show({
                    duration: 10000
                });

                // Reset processing state
                isProcessing = false;
                disablePrintButtons(false);
                currentTaskId = null;

            } else if (mprdstatus == "COMPLETE") {
                var folderObj = {};
                if (printT == "bom") {
                    folderObj["folderid"] = 4721;
                } else if (printT == "pdf") {
                    folderObj["folderid"] = 4723;
                }

                folderObj["batchid"] = batchCount;
                var timestamp = new Date().getTime();
                folderObj["timestamp"] = timestamp; // Add timestamp to prevent caching

                var outputSendURL = url.resolveScript({
                    scriptId: 'customscript_sut_compress_zipfile',
                    deploymentId: 'customdeploy_sut_compress_zipfile',
                    returnExternalUrl: false,
                    params: folderObj
                });

                var myMsg = message.create({
                    title: "Success",
                    message: "Processing complete! Download will start shortly...",
                    type: message.Type.CONFIRMATION
                });
                myMsg.show({
                    duration: 5000
                });

                // Reset processing state before download
                isProcessing = false;
                disablePrintButtons(false);
                currentTaskId = null;

                // Start download after a short delay
                setTimeout(function () {
                    window.onbeforeunload = null;
                    window.location.href = outputSendURL;

                    // Refresh the page after download
                    setTimeout(function () {
                        var refreshURL = url.resolveScript({
                            scriptId: 'customscript_sl_print_work_orders',
                            deploymentId: 'customdeploy_sl_print_work_orders',
                            returnExternalUrl: false
                        });
                        window.location.href = refreshURL;
                    }, 10000);
                }, 2000);

            } else {
                // Handle unknown status
                console.warn("Unknown task status:", mprdstatus);
                currentPollingInterval = setTimeout(function () {
                    startTime(mprdTaskId, outputURL, size, printT, batchCount);
                }, 5000);
            }

        } catch (e) {
            console.error("Error in polling:", e);

            // On error, reset after a delay
            setTimeout(function () {
                isProcessing = false;
                disablePrintButtons(false);
                currentTaskId = null;

                dialog.alert({
                    title: "Connection Error",
                    message: "Failed to check status. Please try again."
                });
            }, 1000);
        }
    }

    // Remove duplicate functions that aren't being used
    function printBomButton() {
        // Redirect to the new function
        printBom();
    }

    function printProdTraveler() {
        // Redirect to the new function
        printProductionTraveler();
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        filterButton: filterButton,
        loadSelectedPage: loadSelectedPage,
        printBom: printBom,
        printProductionTraveler: printProductionTraveler,
        printBomButton: printBomButton,
        printProdTraveler: printProdTraveler
    };
});
/**
 * app.js
 */

var jvmMode = "-server";
var space = " ";
var gcCollectorAlgorithm = "";
var enableGCLogRotation = "";
var printGCDetails = "";
var heapDumpOnOOMemory = "";
var aggressiveOpts = "";
var errorFile = "";
var largePages = "";
var jdkVersion = "";

var minHeapSize = "";
var maxHeapSize = "";

var defaultPermSize = "";
var maxPermSize = "";

var defaultMetaspace = "";
var maxMetaspace = "";

var tooltipMap = {}

var verboseGC = '';
var verboseClass = '';
var verboseJNI = '';

var printGCApplicationConcurrentTime = '';
var printGCApplicationStoppedTime = '';
var printAssembly = '';
var printClassHistogram = '';
var printConcurrentLocks = '';

var hashCodeAlgo = '';


var memoryOpts = {};


var inputBindAttrs = 'DOMAttrModified textInput input change keypress paste focus'

/**
 * Populate Tooltip from the tooltip.json file.
 */
function populateTooltip() {
    $.getJSON('data/tooltip.json', function (data) {
        $.each(data.tooltips, function (key, val) {
            tooltipMap['tooltip-' + val.id] = val.tooltip;
            console.log('tooltip-' + val.id);
        });
    });

    $("i").each(function () {
        var id = this.id;
        console.log(id);
        $("#" + id).tooltip({
            "title": function () {
                return "" + tooltipMap[id] + "";
            }
        });
    });
}


/**
 * Function to invoke on document ready.
 */
$(document).ready(function () {
    populateTooltip();

    resetJVMOptions();

    $("[data-toggle=tooltip]").tooltip({html:true});

    // Initial value for jdkVersion
    jdkVersion = $("input:radio[name='jdkVersionRadioGroup']:checked").val();


    $("input[name='jdkVersionRadioGroup']").click(function () {
        jdkVersion = $("input:radio[name='jdkVersionRadioGroup']:checked").val();


        if (jdkVersion == 'jdkVersion8') {
            $("#metaSpace").removeClass('hidden');
            $("#permSize").addClass('hidden');


        } else {
            $("#metaSpace").addClass('hidden');
            $("#permSize").removeClass('hidden');

        }

    });

});


/**
 * GC Algorithm Selector
 */
$('#gcCollector').on('change', function () {

    var gcAlgo = this.value;

    if (gcAlgo == 'g1') {
        gcCollectorAlgorithm = '-XX:+UseG1GC';
        $("#g1ExtraFlags").removeClass('hidden');
    } else if (gcAlgo == 'cms') {
        gcCollectorAlgorithm = '-XX:+UseConcMarkSweepGC';
        $("#g1ExtraFlags").addClass('hidden');
    } else if (gcAlgo == 'parallel') {
        gcCollectorAlgorithm = '-XX:+UseParNewGC -XX:+UseConcMarkSweepGC';
        $("#g1ExtraFlags").addClass('hidden');
    } else {
        gcCollectorAlgorithm = '';
    }


});


/**
 * GC Algorithm Selector
 */
$('#hashcodeSelect').on('change', function () {
    if(!isEmpty(this.value)) {
        hashCodeAlgo = '';
    } else {
        hashCodeAlgo = '-XX:hashCode=' + this.value;

    }
});



/**
 * Reset Form Options
 */
function resetJVMOptions() {
    // Hide the G1 extra option panel
    $("#g1ExtraFlags").addClass('hidden');
    $("#metaSpace").addClass('hidden');
    $("#permSize").removeClass('hidden');

    $("#printGCDetails").text("unchecked");
    $("#enableGCLogRotation").text("unchecked");
}

/**
 * Input box binding
 */

/**
 * HeapSize
 */
$('#minHeapSize').bind(inputBindAttrs, function () {
    updateMemoryInputFields('minHeapSize', $(this).val(),  '-Xms');

});

$('#maxHeapSize').bind(inputBindAttrs, function () {
    updateMemoryInputFields('maxHeapSize', $(this).val(),  '-Xmx');

});

$('#defaultPermSize').bind(inputBindAttrs, function () {
    updateMemoryInputFields('defaultPermSize', $(this).val(),  '-XX:PermSize=');

});

$('#maxPermSize').bind(inputBindAttrs, function () {
    updateMemoryInputFields('maxPermSize', $(this).val(),  '-XX:MaxPermSize=');
});

$('#defaultMetaSpace').bind(inputBindAttrs, function () {
    updateMemoryInputFields('defaultMetaspace', $(this).val(),  '-XX:MetaspaceSize=');
});

$('#maxMetaSpace').bind(inputBindAttrs, function () {
    updateMemoryInputFields('maxMetaspace', $(this).val(),  '-XX:MaxMetaspaceSize=');
});

// G1 GC Flags



function getSizeUnitValue(sizeUnitId) {
    var sizeUnit = '';
    if (sizeUnitId != null) {
        sizeUnit = $('#' + sizeUnitId).val();
    }

    return sizeUnit;
}


function updateMemoryInputFields(varName, varValue, prefix) {
    if (isEmpty(varValue)) {

        var tmpValue = prefix + varValue;
        this[varName] = tmpValue;

        addKeyValueToMap(varName, tmpValue, memoryOpts);

    } else {

        addKeyValueToMap(varName, '', memoryOpts);

        this[varName] = '';
    }
    validateAndRefreshJVMOptions();
}

function addKeyValueToMap(key, value, map) {
    if(!(key in map)) {
        // Value doesn't exist
        console.log('Key doesn exist');
        map['' + key + ''] = value;

    } else {
        console.log('Updating value');

        map['' + key + ''] = value;
    }


}



function isEmpty(data) {
    return $.trim(data) != '';
}


/**
 * Global Change Listener
 */
$("form :input").change(function () {
    validateAndRefreshJVMOptions();
});


function validateAndRefreshJVMOptions() {


    //log output
    console.log("--> " + memoryOpts);




    // Print GC Details
    validateCheckboxInput("printGCDetails", "-XX:+PrintGCDetails");

    // Log Rotation
    validateCheckboxInput("enableGCLogRotation", "-Xloggc:gc.log.'date +%Y%m%d%H%M%S' -XX:+UseGCLogFileRotation");

    // heapDumpOnOOMemory
    validateCheckboxInput("heapDumpOnOOMemory", "-XX:-HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/heapDump.hprof");

    //aggressiveOpts
    validateCheckboxInput("aggressiveOpts", "-XX:+AggressiveOpts");

    //errorFile
    validateCheckboxInput("errorFile", "-XX:ErrorFile=/path/to/error_file.log");

     // Verbose Commands
    validateCheckboxInput("verboseGC", "-verbose:gc");
    validateCheckboxInput("verboseJNI", "-verbose:jni");
    validateCheckboxInput("verboseClass", "-verbose:class");

    //Print
    validateCheckboxInput("printGCApplicationConcurrentTime", "-XX:+PrintGCApplicationConcurrentTime");
    validateCheckboxInput("printGCApplicationStoppedTime", "-XX:+PrintGCApplicationStoppedTime");
    validateCheckboxInput("printAssembly", "-XX:+PrintAssembly");
    validateCheckboxInput("printClassHistogram", "-XX:+PrintClassHistogram");
    validateCheckboxInput("printConcurrentLocks", "-XX:+PrintConcurrentLocks");

    //largePages
    validateCheckboxInput("largePages", "-XX:+UseLargePages");

    refreshJVMFlagRef();
}

function getIdVal(data) {
    return $("#" + data).attr('value');
}


function validateCheckboxInput(chkboxId, jvmFlag) {
    if ($("#" + chkboxId).is(':checked')) {
        this[chkboxId] = jvmFlag;
    } else {
        this[chkboxId] = '';
    }
}


/**
 * Refresh the JVM Options Summary textbox
 */
function refreshJVMFlagRef() {
    $("#jvmFlagResult").text('');

    // Set the JVM Mode
    addTextToJVMSummary(jvmMode);

    // Heap Size
    addMemoryOptsToJVMSummary(minHeapSize , getSizeUnitValue('heapSizeSelect'));
    addMemoryOptsToJVMSummary(maxHeapSize , getSizeUnitValue('heapSizeSelect'));


    if(jdkVersion == 'jdkVersion8') {
        // Metaspace
        addMemoryOptsToJVMSummary(defaultMetaspace  , getSizeUnitValue('metaSpaceSelect'));
        addMemoryOptsToJVMSummary(maxMetaspace , getSizeUnitValue('metaSpaceSelect'));
    } else {
        // Perm Size
        addMemoryOptsToJVMSummary(defaultPermSize , getSizeUnitValue('permSizeSelect'));
        addMemoryOptsToJVMSummary(maxPermSize , getSizeUnitValue('permSizeSelect'));
    }

    // GC Collector Algorithm
    addTextToJVMSummary(gcCollectorAlgorithm);

    // hashcode Algo
    addTextToJVMSummary(hashCodeAlgo);

    // Verbose Commands
    addTextToJVMSummary(verboseGC);
    addTextToJVMSummary(verboseJNI);
    addTextToJVMSummary(verboseClass);


    // Print GC Details
    addTextToJVMSummary(printGCDetails);

    // GC Log Rotation
    addTextToJVMSummary(enableGCLogRotation);

    // GC Log Rotation
    addTextToJVMSummary(heapDumpOnOOMemory);

    //Error File
    addTextToJVMSummary(errorFile);

    addTextToJVMSummary(printGCApplicationConcurrentTime);
    addTextToJVMSummary(printGCApplicationStoppedTime);
    addTextToJVMSummary(printAssembly);
    addTextToJVMSummary(printClassHistogram);
    addTextToJVMSummary(printConcurrentLocks);



    //Enable AggressiveOpts
    addTextToJVMSummary(aggressiveOpts);

    //Enable Largepages
    addTextToJVMSummary(largePages);
}


function addTextToJVMSummary(val) {

    if (!val.trim()) {
        // String is empty; don't do anything
    } else {
        $("#jvmFlagResult").append(val);
        $("#jvmFlagResult").append(space);
    }
}


function addMemoryOptsToJVMSummary(val, sizeSelect) {

    if (!val.trim()) {
        // String is empty; don't do anything
    } else {
        $("#jvmFlagResult").append(val + sizeSelect);
        $("#jvmFlagResult").append(space);
    }
}

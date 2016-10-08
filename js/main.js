var groupSize, fileName;

var opts = {
    accept: "text/xml",
    dragClass: "drag",
    readAsDefault: "Text",
    on: {
        load: function (e, file) {
            if (groupSize > 1) return;

            fileName = file.name;
            var xml = e.target.result;
            read(xml);
        },
        skip: function () {
            showError("File must be a xml file!");
        },
        groupstart: function (group) {
            groupSize = group.files.length;
        },
        groupend: function (group) {
            if (group.files.length > 1) {
                showError("Upload only 1 file, please")
            }
        }
    }
};

// Constants

var SVG_HEADER = "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>" +
    "\n" + "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">" +
    "\n" + "<svg width=\"%Wpt\" height=\"%Hpt\" viewBox=\"0 0 %W %H\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\">";

var GROUP = "<g id=\"%C\">";
var PATH = "<path fill=\"%F\" opacity=\"1.00\" d=\"%D\" />";
var INDENT = "    ";

var ATTR_VIEWPORTWIDTH = "android:viewportWidth";
var ATTR_VIEWPORTHEIGHT = "android:viewportHeight";
var ATTR_FILLCOLOR = "android:fillColor";
var ATTR_PATHDATA = "android:pathData";

// -------------------

// Utils

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

if (typeof window.DOMParser != "undefined") {
    parseXml = function (xmlStr) {
        return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
    };
} else if (typeof window.ActiveXObject != "undefined" &&
    new window.ActiveXObject("Microsoft.XMLDOM")) {
    parseXml = function (xmlStr) {
        var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = "false";
        xmlDoc.loadXML(xmlStr);
        return xmlDoc;
    };
} else {
    throw new Error("No XML parser found");
}

function showError(text) {
    $("#errorDiv").removeClass("gone");
    $("#error").text(text);
}

function fileNameNoExt(filename) {
    var dotIndex = filename.lastIndexOf(".");
    if (dotIndex > -1) {
        filename = filename.substr(0, dotIndex);
    }
    filename = filename.toLowerCase();
    filename = filename.replace(/[^a-z0-9]/gi, '_');

    return filename;
}

// -------------------

function read(result) {
    var xml = parseXml(result);

    if (xml.documentElement.nodeName != "vector") {
        showError("XML file doesn't start with <vector> tag");
        return;
    }

    var viewportWidth = xml.documentElement.getAttribute(ATTR_VIEWPORTWIDTH);
    var viewportHeight = xml.documentElement.getAttribute(ATTR_VIEWPORTHEIGHT);

    var svg = SVG_HEADER.replaceAll("%W", viewportWidth).replaceAll("%H", viewportHeight);

    var pathNumber = xml.getElementsByTagName("path").length;

    if (pathNumber == 0) {
        showError("This XML file has no <path> tag");
        return;
    }

    var lastColor = "";
    for (var i = 0; i < pathNumber; i++) {
        var fillColor = xml.getElementsByTagName("path")[i].getAttribute(ATTR_FILLCOLOR);
        var pathData = xml.getElementsByTagName("path")[i].getAttribute(ATTR_PATHDATA);

        var group = GROUP.replace("%C", fillColor);

        if (lastColor != fillColor) {
            if (lastColor != "") svg += "\n" + INDENT + "</g>";

            svg += "\n" + INDENT + group;
        }

        svg += "\n" + INDENT + INDENT + PATH.replace("%F", fillColor).replace("%D", pathData);

        lastColor = fillColor;
    }

    if (lastColor != "") svg += "\n" + INDENT + "</g>";
    svg += "\n" + "</svg>";

    $("#errorDiv").addClass("gone");
    $("#uploadSpace").addClass("gone");
    $("#uploadSpaceSmall").removeClass("gone");
    $("#previewDiv").removeClass("gone");

    $("#code").text(svg);
    $("#preview").html(svg);

    $('pre code').each(function (i, block) {
        hljs.highlightBlock(block);
    });
}

$("#uploadFile, #uploadSpace, #uploadSpaceSmall").fileReaderJS(opts);

$("#save-svg").click(function () {
    var blob = new Blob([$("#preview").html()], {type: "image/xml+svg;charset=utf-8"});

    fileName = fileNameNoExt(fileName) || "";

    saveAs(blob, fileName + ".svg", true);
});

$("#github").click(function () {
    window.open("https://github.com/dvdandroid/vector2svg", "_blank");
});

var clipboard = new Clipboard('#copy-svg', {
    text: function () {
        return $("#preview").html()
            .replace("<!--", "<")
            .replace("-->", ">\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">")
            .replace("\n<svg", "<svg");
    }
});
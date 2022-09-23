/* Salesforce Show Resources - v0.1.1
*/
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("ImagesTab").addEventListener("click", function(){
        document.getElementById("LabelsTab").style.display = 'none'; // Hide button
        handler('images');
    });
    document.getElementById("LabelsTab").addEventListener("click", function(){
        document.getElementById("ImagesTab").style.display = 'none';
        handler('labels');
    });
    document.getElementById("sortLabels").addEventListener("click", function(){
        orderLabels();
    });
    document.getElementById("sortLabelsDesc").addEventListener("click", function(){
        orderLabelsDesc();   
    });
    
});

function handler(option){

    getSFData(option);
    // Do not execute code after this function call
}

function getSFData(option) {

    document.getElementById('appendItems').innerHTML = ''; // Reset images
    document.getElementById('appendTableItems').innerHTML = ''; // Reset labels

    var urlListResources = '';
    var urlResource = '.my.salesforce.com/';
    var imagenes = []; 

    switch (option) {
        case 'images':
            urlListResources = '.my.salesforce.com/apexpages/setup/listStaticResource.apexp';
            document.getElementById('appendTable').style.display = 'none';
            break;
        case 'labels':
            urlListResources = '.my.salesforce.com/101?retURL=%2Fui%2Fsetup%2FSetup%3Fsetupid%3DDevTools&setupid=ExternalStrings';
            document.getElementById('appendTable').style.display = 'block';
            break;
        default:
            break;
    }

    // Retrieve current background URL 
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {

        let url = tabs[0].url;
        var completeUrl = 'error';
        var partialUrl = '';
        var urlSectionImage = '';

        if(url.includes('lightning.force.com')){
            var urlSection = url.substring(0, url.lastIndexOf('.lightning.force.com/'));
            completeUrl = urlSection + urlListResources;
            partialUrl = urlSection + urlResource;
            urlSectionImage = urlSection;

        }else if(url.includes('my.salesforce.com')){
            var urlSection = url.substring(0, url.lastIndexOf('.my.salesforce.com/'));
            completeUrl = urlSection + urlListResources;
            partialUrl = urlSection + urlResource;
            urlSectionImage = urlSection;
        }

        if(completeUrl != 'error'){

            switch (option){
                case 'images':   
                    document.getElementById('loading').style= 'display: block;'; // Show Spinner
                    document.getElementById('appendItems').style = 'display: none;'; // Hide div block     

                    // Retrieve all static resources (images)
                    $.get(completeUrl + '?thePage%3AtheTemplate%3Aj_id6%3Alsi=-7').then(function (html){
                        var $mainbar = $(html).find('.list').find('th');
                        var prefijos = [];
                        var validar = false;
                        $mainbar.each(function(index){
                            if(validar){
                                prefijos.push($(this).html());
                            }
                            if($(this).text() == 'Cache Control' || $(this).text() == 'Control de caché'){ // Diccionario - contains(Control de cache en Varios idiomas)
                                validar = true;
                            } 
                        })
                        prefijos.forEach(element => {
                            var str = element.toString();
                            var link = str.substring(str.indexOf('/') + 1, str.lastIndexOf('"'));

                            // Retrieve data from each image
                            $.get(partialUrl + link).then(function (html){
                                var $mainImagen = $(html).find('.detailList').find('tr:nth-child(-3n+4)');
                                var resourceName;
                                $mainImagen.each(function(index){
                                    var cad = $(this).find('span').html();

                                    if(index == 0){
                                        resourceName = cad; 
                                    }else if(index == 1){
                                        // Appends image to the document
                                        if(cad.includes('image')){
                                            var src = '';
                                            if(urlSectionImage.includes('sandbox')){
                                                var urlSandbox = urlSectionImage.substring(0, urlSectionImage.lastIndexOf('.sandbox'));
                                                var newUrlSandbox = urlSandbox + '--c.sandbox';
                                                src = newUrlSandbox + '.vf.force.com/resource/' + resourceName;
                                            }else if(!urlSectionImage.includes('sandbox')){
                                                src = urlSectionImage + '--c.visualforce.com/resource/' + resourceName;
                                            }
                                            
                                            var img = document.createElement('img');
                                                img.src = src;
                                                img.style = 'width: 100px; height: 100px;';

                                            var button = document.createElement('button');
                                                button.classList.add('imageButton');
                                                button.addEventListener('click', function(){
                                                    copyToClipBoard(resourceName, 'image');
                                                });
                                                button.addEventListener('mouseleave', function(){
                                                    removeCopyToClipBoard();
                                                });
                                                button.appendChild(img);
                                            
                                                document.getElementById('appendItems').appendChild(button);
                                        }   
                                    } 
                                    imagenes.push(cad);
                                });
                            });
                        });
                        setTimeout(() => {
                            document.getElementById('loading').style.display = 'none'; // Remove Spinner
                            document.getElementById('appendItems').style.display = 'block'; // Show div block
                            document.getElementById("LabelsTab").style.display = 'block';
                        }, 2000);
                    });
                    break;

                case 'labels':
                    document.getElementsByClassName('headerTable')[0].style = 'display: none;'; // Hide table header
                    document.getElementById('loading').style= 'display: block;'; // Show Spinner
                    document.getElementById('appendTableItems').style = 'display: none;'; // Hide div block

                    $.get(completeUrl).then(function (html){
                        var $mainbar = $(html).find('.list').find('th');
                        var prefijos = [];
                        var validar = false;
                        $mainbar.each(function(index){
                            if(validar){
                                let insideTD = $(this).prev().children();
                                if($(insideTD).html() == undefined){
                                    prefijos.push($(this).html());
                                }
                            }
                            if($(this).text() == 'Language' || $(this).text() == 'Idioma'){
                                validar = true;
                            }
                        });

                        prefijos.forEach(element => {

                            var str = element.toString();
                            var link = str.substring(str.indexOf('/') + 1, str.lastIndexOf('"'));
                            var tr = document.createElement('tr');
                            var linkLabelEdit = partialUrl + link + '/e?retURL=%2F' + link;

                            // Retrieve data from each custom label
                            $.get(partialUrl + link).then(function (html){
                                var $mainLabel= $(html).find('.detailList').find('tr:nth-child(-3n+4)');
                                var isManaged =  $(html).find('.pageDescription');
                                var resourceName;

                                if(!isManaged.text().includes('Managed')){ // Filters managed labels

                                    $mainLabel.each(function(index){   
                                        if(index == 0){

                                            // Label Name
                                            var labelName = $(this).find('td:nth-child(4)').html();
                                            var div = document.createElement('div');
                                                div.style = 'height: 50px; overflow: hidden; padding-left: 10px;';
                                            var td = document.createElement('td');
                                                div.innerText = labelName;
                                                td.style = 'border-bottom: 1px solid rgb(210, 223, 230); border-right: 1px solid rgb(210, 223, 230); width: 30%;';
                                                td.appendChild(div);
                                                tr.appendChild(td);

                                            resourceName = labelName;
                                            
                                        }else if(index == 1){
                                            
                                            // Value
                                            var labelDesc = $(this).find('td:nth-child(2)').html();
                                            var div = document.createElement('div');
                                                div.style = 'padding-left: 5px; height: 50px; overflow: scroll; overflow-x: hidden; overflow-y: auto';
                                            var td = document.createElement('td');
                                                div.innerText = labelDesc;
                                                td.style = 'border-bottom: 1px solid rgb(210, 223, 230); border-right: 1px solid rgb(210, 223, 230); width: 50%;';
                                                td.appendChild(div);
                                                tr.appendChild(td);

                                            // Copy Button  
                                            var divCopy = document.createElement('div');
                                                divCopy.classList.add('copyButton'); 
                                            var tdCopy = document.createElement('td');
                                                divCopy.innerText = 'Copy';
                                                tdCopy.style = 'cursor: pointer;';
                                                tdCopy.appendChild(divCopy);
                                                tdCopy.addEventListener('click', function(){
                                                    copyToClipBoard(resourceName, 'label');
                                                });
                                                tdCopy.addEventListener('mouseleave', function(){
                                                    removeCopyToClipBoard();
                                                });
                                                tr.appendChild(tdCopy);

                                            // Edit button
                                            var divEdit = document.createElement('div');
                                                divEdit.classList.add('copyButton');     
                                            var tdEdit= document.createElement('td');
                                                divEdit.innerText = 'Edit';
                                                tdEdit.style = 'cursor: pointer;';
                                                tdEdit.appendChild(divEdit);
                                                tdEdit.addEventListener('click', function(){
                                                    window.open(linkLabelEdit, '_blank').focus();
                                                });
                                                tr.appendChild(tdEdit);
                                        }
                                    });
                                    document.getElementById('appendTableItems').appendChild(tr);
                                }
                            });
                        });
                        setTimeout(() => {
                            orderLabels();
                            document.getElementsByClassName('headerTable')[0].style.display = 'block'; // Hide table header
                            document.getElementById('loading').style.display = 'none'; // Remove Spinner
                            document.getElementById('appendTableItems').style.display = 'block'; // Show div block
                            document.getElementById("ImagesTab").style.display = 'block';
                        }, 2000);
                    });
                    break;
                default:
                    break;
            }
            
        }
    });
}

function orderLabels(){
    var table = document.getElementById('appendTableItems');
    var itemsTR = table.querySelectorAll('tr');

    $(itemsTR).sort(function (a, b) {
        if ($(a).find('td').first().find('div').text().toLowerCase() > $(b).find('td').first().find('div').text().toLowerCase()) {
          return 1;
        }
        if ($(a).find('td').first().find('div').text().toLowerCase() < $(b).find('td').first().find('div').text().toLowerCase()) {
          return -1;
        }
        // a equals b
        return 0;
    }).prependTo('#appendTableItems');

    document.getElementById("sortLabels").style.display = 'none';
    document.getElementById("sortLabelsDesc").style.display = 'inline';
}

function orderLabelsDesc(){
    var table = document.getElementById('appendTableItems');
    var itemsTR = table.querySelectorAll('tr');

    $(itemsTR).sort(function (a, b) {
        if ($(a).find('td').first().find('div').text().toLowerCase() < $(b).find('td').first().find('div').text().toLowerCase()) {
          return 1;
        }
        if ($(a).find('td').first().find('div').text().toLowerCase() > $(b).find('td').first().find('div').text().toLowerCase()) {
          return -1;
        }
        // a equals b
        return 0;
    }).prependTo('#appendTableItems');
    
    document.getElementById("sortLabelsDesc").style.display = 'none';
    document.getElementById("sortLabels").style.display = 'inline';
}

async function copyToClipBoard(resourceName, type){
    if(type == 'image'){
        navigator.clipboard.writeText('$Resource.' + resourceName);
    }else if(type == 'label'){
        navigator.clipboard.writeText('$Label.' + resourceName);
    }
    document.getElementById('floatRight').style.display = 'block';
}

async function removeCopyToClipBoard(){
    document.getElementById('floatRight').style.display = 'none';
}

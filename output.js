const WPAGE_MAX = 50;
const HPAGE_MAX = 70;
const IMG_SCALE = 8;
const IMG_MARGIN = 30

//画像形式で変換
function OutputPng(context, rsltArr, csvdata){
    var width = rsltArr.length;
    var height = rsltArr[0].length;

    var imgdata = context.createImageData(width, height);

    for(var x = 0; x < width; x++){
	    for(var y = 0; y < height; y++){
            var idx = rsltArr[x][y];
            var pos = (x + y * width) * 4;

            imgdata.data[pos] = csvdata[idx][2];
            imgdata.data[pos + 1] = csvdata[idx][3];
            imgdata.data[pos + 2] = csvdata[idx][4];
            imgdata.data[pos + 3] = 255;
        }
    }
        
    context.putImageData(imgdata, 0, 0);
}

//PDF形式で出力
function OutputPDF(rsltArr, csvdata, colorCnt){
    var pageCount = 1;
    const pdf = new jspdf.jsPDF("portrait", "px", "a4");

    const rslt_canvas = document.getElementById("rslt_canvas");
    const rslt_ctxt = rslt_canvas.getContext('2d');

    var img = new Image();
    img.src = rslt_canvas.toDataURL();

    img.addEventListener("load", (e) => {
        //概要ページ出力
        DrawOutline(rsltArr, img, pdf, colorCnt);
        //使用色ページ出力
        DrawUsedColor(rsltArr, csvdata, pdf, colorCnt);
        //図案出力
        DrawPattern(rsltArr, csvdata, img, pdf);
        
        pdf.save('pattern.pdf');
    });
}

//概要ページ出力
function DrawOutline(rsltArr, img, pdf, colorCnt){
    var width = rsltArr.length;
    var height = rsltArr[0].length;
    
    pdf.setFont('Koruri-Regular', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(0,0,0);
    pdf.text(width + "目 × " + height + "目", IMG_MARGIN, IMG_MARGIN);
    pdf.text(selMaterial + "、" + colorCnt + "色", IMG_MARGIN, IMG_MARGIN + 12);

    pdf.addImage(img, 'png', IMG_MARGIN, IMG_MARGIN + 30, 0, 0);
}

//使用色ページ出力
function DrawUsedColor(rsltArr, csvdata, pdf, colorCnt){
    var width = rsltArr.length;
    var height = rsltArr[0].length;

    pdf.setFont('Koruri-Regular', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(0,0,0);

    for(let i = 0; i < colorCnt; i++){
        for(let j = 0; j < csvdata.length; j++){
            if(csvdata[j].length >= 7){
                if(csvdata[j][5] == i){
                    var line = i % 40;

                    if(line== 0){
                        pdf.addPage("a4", "portrait");
                    }

                    let cnt = 0;

                    for(let x = 0; x < width; x++){
                        for(let y = 0; y < height; y++){
                            if(rsltArr[x][y] == j){
                                cnt++;
                            }
                        }
                    }

                    pdf.setFillColor(csvdata[j][2], csvdata[j][3], csvdata[j][4]);
                    pdf.rect(IMG_MARGIN, IMG_MARGIN + line * 15 - 8, 20, 10, 'FD');
                            
                    //文字色設定
                    setTextColor(csvdata[j], pdf);
                    pdf.text(csvdata[j][6], IMG_MARGIN + 5, IMG_MARGIN + line * 15);

                    pdf.setTextColor(0,0,0);
                    pdf.text(csvdata[j][0], IMG_MARGIN + 30, IMG_MARGIN + line * 15);
                    pdf.text(csvdata[j][1], IMG_MARGIN + 100, IMG_MARGIN + line * 15);
                    pdf.text(cnt + "目", IMG_MARGIN + 200, IMG_MARGIN + line * 15);
                }
            }
        }
    }

}

//図案出力
function DrawPattern(rsltArr, csvdata, img, pdf){
    var width = rsltArr.length;
    var height = rsltArr[0].length;
    var wpageMax = Math.ceil(width / WPAGE_MAX);
    var hpageMax = Math.ceil(height / HPAGE_MAX);

    pdf.setDrawColor('#000000');
    pdf.setFontSize(4);

    for(let hpage = 0; hpage < hpageMax; hpage++){
        for(let wpage = 0; wpage < wpageMax; wpage++){
            pdf.addPage("a4", "portrait");

            //PDF1ページ描画
            DrawPage(wpage, hpage, img, pdf);

            DrawString(wpage, hpage, img, pdf, rsltArr, csvdata);
        }
    }
}

//PDF1ページ描画
function DrawPage(wpage, hpage, img, pdf){
    var lineStart = 0;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = WPAGE_MAX;
    canvas.height = HPAGE_MAX;
    
    context.drawImage(img, wpage * WPAGE_MAX, hpage * HPAGE_MAX, WPAGE_MAX, HPAGE_MAX,
                      0, 0, WPAGE_MAX, HPAGE_MAX);
        
    const imgData = canvas.toDataURL();
    pdf.addImage(imgData, 'png', IMG_MARGIN, IMG_MARGIN, WPAGE_MAX * IMG_SCALE, HPAGE_MAX * IMG_SCALE);

    //横方向の線描画
    for(let h = 0; h < HPAGE_MAX + 1; h++){
        if(h % 10 == 0){
            pdf.text(String(h + hpage * HPAGE_MAX), IMG_MARGIN - 12, h * IMG_SCALE + IMG_MARGIN + 2);

            pdf.setLineWidth(1); 
            lineStart = IMG_MARGIN - 5;
        }
        else{
            pdf.setLineWidth(0.5); 
            lineStart = IMG_MARGIN;
        }
        pdf.line(lineStart, 
                 h * IMG_SCALE + IMG_MARGIN, 
                 WPAGE_MAX * IMG_SCALE + IMG_MARGIN, 
                 h * IMG_SCALE + IMG_MARGIN);
    }
    //縦方向の線描画
    for(let w = 0; w < WPAGE_MAX + 1; w++){
        if(w % 10 == 0){
            pdf.text(String(w + wpage * WPAGE_MAX), w * IMG_SCALE + IMG_MARGIN - 2, IMG_MARGIN - 6);

            pdf.setLineWidth(1); 
            lineStart = IMG_MARGIN - 5;
        }
        else{
            pdf.setLineWidth(0.5); 
            lineStart = IMG_MARGIN;
        }
        pdf.line(w * IMG_SCALE + IMG_MARGIN, 
                 lineStart, 
                 w * IMG_SCALE + IMG_MARGIN, 
                 HPAGE_MAX * IMG_SCALE + IMG_MARGIN);
    }

    return imgData;
}

function DrawString(wpage, hpage, img, pdf, rsltArr, csvdata){
    let width = rsltArr.length;
    let height = rsltArr[0].length;

    let hmax = HPAGE_MAX;
    let wmax = WPAGE_MAX;

    if((wpage + 1) * WPAGE_MAX > width){
        wmax = width - wpage * WPAGE_MAX;
    }

    if((hpage + 1) * HPAGE_MAX > height){
        hmax = height - hpage * HPAGE_MAX;
    }

    for(let w = 0; w < wmax; w++){
        for(let h = 0; h < hmax; h++){
            let wel = w + wpage * WPAGE_MAX;
            let hel = h + hpage * HPAGE_MAX;
            let idx = rsltArr[wel][hel];
            let str = csvdata[idx][6];

            //文字色設定
            setTextColor(csvdata[idx], pdf);
            //記号描画
            pdf.text(str, w * IMG_SCALE + IMG_MARGIN + IMG_SCALE / 2 - 3, h * IMG_SCALE + IMG_MARGIN + IMG_SCALE / 2 + 1);
        }
    }
}
function setTextColor(csvline, pdf) {
    let r = csvline[2];
    let g = csvline[3];
    let b = csvline[4];

    if((((r * 299) + (g * 587) + (b * 114)) / 1000) < 128){
        pdf.setTextColor(255,255,255);
    }
    else{
        pdf.setTextColor(0,0,0);
    }
}

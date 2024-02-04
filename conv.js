var symbolArr = [];

const largeCapArr = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", 
                     "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
const smallCapArr = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
                     "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
const numberArr = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const asciiArr = ["!", "#", "$", "%", "&", "(", ")", "-", "^", "/", 
                  "@", ":", "=", "~", "+", "*", "<", ">", "?"];

var convway = false;

//刺繍糸、ビーズ色変換
function ConvToDsg(context, csvdata)
{
    var idx = 0;
    var colorArr = {};
    var height = context.canvas.height;
    var width = context.canvas.width;
    var resultArr = [];

    //図面の記号を作成
    CreateSymbolArr();

    //変換方法選択
    let rdb = document.getElementsByName('rd_conv');
    for (let i = 0; i < rdb.length; i++) {
        if (rdb[i].checked) {
            if(rdb[i].value == "cie94"){
                convway = true;
            }
            else{
                convway = false;
            }
        }
    }

    //1ドットごとに色変換
    for(var x = 0; x < width; x++){
        resultArr[x] = [];

	    for(var y = 0; y < height; y++){
            var rgba = context.getImageData(x, y, 1, 1).data;
			var r = rgba[0];
			var g = rgba[1];
            var b = rgba[2];
            
            var c = String(r * 256 * 256 + g * 256 + b);

            //すでに変換済みか
            if (c in colorArr) {
                idx = colorArr[c];
            }
            else{
                //RGBから対象の糸・ビーズへ変換
                idx = PickColors(r, g, b, csvdata);
                colorArr[c] = idx;
            }

            resultArr[x][y] = idx;            
		}
    }

    //糸・ビーズデータを元に記号を付番
    var cnt = 0;
    for (let key in colorArr) {
        idx = colorArr[key];
        if(csvdata[idx].length <= 5){
            csvdata[idx][5] = cnt;
            csvdata[idx][6] = symbolArr[cnt];
            cnt++;
        }
    }
    
    return [resultArr, cnt];
}

//RGBから対象の糸・ビーズへ変換
function PickColors(r, g, b, csvData)
{
    var colorArr = [];
    var diff = 255 * 255;
    var idx = 0;
	var srcLab = [];

	srcLab = rgbToLab(r,g,b);
	
	for(var i = 0; i < csvData.length; ++i){
        csvLab = rgbToLab(csvData[i][2], csvData[i][3], csvData[i][4]);
        
        var temp;
        
        if(convway == true){
            temp = cie94(srcLab[0], srcLab[1], srcLab[2], csvLab[0], csvLab[1], csvLab[2]);
        }
        else{
            temp = ciede2000(srcLab[0], srcLab[1], srcLab[2], csvLab[0], csvLab[1], csvLab[2]);
        }

        if(temp < diff)
        {
            idx = i;
            diff = temp;
        }
    }
    
    return idx;
}

//CIE94で色変換
function cie94(L1,a1,b1, L2,a2,b2, kL=1,kC=1,kH=1) {
    //https://en.wikipedia.org/wiki/Color_difference#CIE94

    var K1;
    var K2;
    if (kL == 1) {
        K1 = 0.045;
        K2 = 0.015;
    } else {
        K1 = 0.048;
        K2 = 0.014;
    }
    var deltaL = L1 - L2;
    var C1 = Math.sqrt(Math.pow(a1, 2) + Math.pow(b1, 2));
    var C2 = Math.sqrt(Math.pow(a2, 2) + Math.pow(b2, 2));
    var deltaCab = C1 - C2;
    var deltaa = a1 - a2;
    var deltab = b1 - b2;
    var deltaHab = Math.sqrt(
            Math.pow(deltaa, 2) +
            Math.pow(deltab, 2) -
            Math.pow(deltaCab, 2)
        );
    var SL = 1;
    var SC = 1 + (K1 * C1);
    var SH = 1 + (K2 * C1);

    return Math.sqrt(
            Math.pow((deltaL/(kL*SL)), 2) +
            Math.pow((deltaCab/(kC*SC)), 2) +
            Math.pow((deltaHab/(kH*SH)), 2)
        );
};

//CIEDE2000で色変換
function ciede2000(L1,a1,b1, L2,a2,b2, kL=1,kC=1,kH=1) {
    //http://en.wikipedia.org/wiki/Color_difference#CIEDE2000
    var radianToDegree = function(radian) {return radian * (180 / Math.PI);};
    var degreeToRadian = function(degree) {return degree * (Math.PI / 180);};

    var deltaLp = L2 - L1;
    var L_ = (L1 + L2) / 2;
    var C1 = Math.sqrt(Math.pow(a1, 2) + Math.pow(b1, 2));
    var C2 = Math.sqrt(Math.pow(a2, 2) + Math.pow(b2, 2));
    var C_ = (C1 + C2) / 2;
    var ap1 = a1 + (a1 / 2) *
        (1 - Math.sqrt(
            Math.pow(C_, 7) /
            (Math.pow(C_, 7) + Math.pow(25, 7))
            )
        );
    var ap2 = a2 + (a2 / 2) *
        (1 - Math.sqrt(
            Math.pow(C_, 7) /
            (Math.pow(C_, 7) + Math.pow(25, 7))
            )
        );
    var Cp1 = Math.sqrt(Math.pow(ap1, 2) + Math.pow(b1, 2));
    var Cp2 = Math.sqrt(Math.pow(ap2, 2) + Math.pow(b2, 2));
    var Cp_ = (Cp1 + Cp2) / 2;
    var deltaCp = Cp2 - Cp1;

    var hp1;
    if (b1 == 0 && ap1 == 0) {
        hp1 = 0;
    } else {
        hp1 = radianToDegree(Math.atan2(b1, ap1));
        if (hp1 < 0) {hp1 = hp1 + 360;}
    }
    var hp2;
    if (b2 == 0 && ap2 == 0) {
        hp2 = 0;
    } else {
        hp2 = radianToDegree(Math.atan2(b2, ap2));
        if (hp2 < 0) {hp2 = hp2 + 360;}
    }

    var deltahp;
    if (C1 == 0 || C2 == 0) {
        deltahp = 0;
    } else if (Math.abs(hp1 - hp2) <= 180) {
        deltahp = hp2 - hp1;
    } else if (hp2 <= hp1) {
        deltahp = hp2 - hp1 + 360;
    } else {
        deltahp = hp2 - hp1 - 360;
    }

    var deltaHp = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin(degreeToRadian(deltahp) / 2);

    var Hp_;
    if (Math.abs(hp1 - hp2) > 180) {
        Hp_ =  (hp1 + hp2 + 360) / 2
    } else {
        Hp_ = (hp1 + hp2) / 2
    };

    var T = 1 -
        0.17 * Math.cos(degreeToRadian(Hp_ - 30)) +
        0.24 * Math.cos(degreeToRadian(2 * Hp_)) +
        0.32 * Math.cos(degreeToRadian(3 * Hp_ + 6)) -
        0.20 * Math.cos(degreeToRadian(4 * Hp_ - 63));

    var SL = 1 + (
        (0.015 * Math.pow(L_ - 50, 2)) /
        Math.sqrt(20 + Math.pow(L_ - 50, 2))
        );
    var SC = 1 + 0.045 * Cp_;
    var SH = 1 + 0.015 * Cp_ * T;

    var RT = -2 *
        Math.sqrt(
            Math.pow(Cp_, 7) /
            (Math.pow(Cp_, 7) + Math.pow(25, 7))
        ) *
        Math.sin(degreeToRadian(
            60 * Math.exp(-Math.pow((Hp_ - 275) / 25, 2))
        ));

    return Math.sqrt(
        Math.pow(deltaLp / (kL * SL), 2) +
        Math.pow(deltaCp / (kC * SC), 2) +
        Math.pow(deltaHp / (kH * SH), 2) +
        RT * (deltaCp / (kC * SC)) * (deltaHp / (kH * SH))
        );
}


//RGBからLab形式へ変換
function rgbToLab(r,g,b) {
    //https://en.wikipedia.org/wiki/SRGB#The_reverse_transformation
    var r = r / 255;
    var g = g / 255;
    var b = b / 255;

    r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
    g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
    b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);

    var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
    var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
    var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

    //https://en.wikipedia.org/wiki/Lab_color_space#CIELAB-CIEXYZ_conversions
    var L;
    var a;
    var b;

    x *= 100;
    y *= 100;
    z *= 100;

    x /= 95.047;
    y /= 100;
    z /= 108.883;

    x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (4 / 29);
    y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (4 / 29);
    z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (4 / 29);

    L = (116 * y) - 16;
    a = 500 * (x - y);
    b = 200 * (y - z);

    return [L, a, b];
}

//図面の記号を作成
function CreateSymbolArr(){
    symbolArr = symbolArr.concat(largeCapArr);
    symbolArr = symbolArr.concat(numberArr);
    symbolArr = symbolArr.concat(asciiArr);
    symbolArr = symbolArr.concat(smallCapArr);

    for(let i = 0; i < largeCapArr.length; i++){
        for(let j = 0; j < numberArr.length; j++){
            symbolArr[symbolArr.length] = largeCapArr[i] + numberArr[j];
        }
    }
    for(let i = 0; i < smallCapArr.length; i++){
        for(let j = 0; j < numberArr.length; j++){
            symbolArr[symbolArr.length] = smallCapArr[i] + numberArr[j];
        }
    }
}
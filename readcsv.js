var dmcdata;
var fuse2data;
var fuse5data;
var perlerdata;

//刺繍糸、ビーズ色データ読み込み
function ReadCSV()
{
    //糸 DMC
    var dmcprms = GetCSV("dmc.csv");
    dmcprms.then(function(response) {
        dmcdata = response;
    });
    //フューズビーズミニ
    var fuse2prms = GetCSV("fuse2.csv");
    fuse2prms.then(function(response) {
        fuse2data = response;
    });
    //フューズビーズミドル
    var fuse5prms = GetCSV("fuse5.csv");
    fuse5prms.then(function(response) {
        fuse5data = response;
    });
    //パーラービーズ
    var perlerprms = GetCSV("perler.csv");
    perlerprms.then(function(response) {
        perlerdata = response;
    });
}

//CSVファイル読み込み
async function GetCSV(filename)
{
    const response = await fetch(filename);
    //const text = await response.text();
    const arrayBuffer = await response.arrayBuffer();
    const text = new TextDecoder('shift-jis').decode(arrayBuffer);
    
    var rslt = [];
    const lines = text.trim().split('\n');

    for(var i = 0; i < lines.length; i++){
        var line = lines[i].split(',');
        
        rslt[i] = [];
        rslt[i][0] = line[0];
        rslt[i][1] = line[1];
        //RGB
        rslt[i][2] = Number(line[2]);
        rslt[i][3] = Number(line[3]);
        rslt[i][4] = Number(line[4]);
    }

    return rslt;
}
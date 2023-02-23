function init2() {
    document.getElementById('fileInput2').addEventListener('change', handleFileSelect2, false);
}

function handleFileSelect2(event) {
    const reader = new FileReader()
    reader.onload = handleFileLoad2;
    reader.readAsText(event.target.files[0])
}

function handleFileLoad2(event) {
    const csv = event.target.result;
    document.getElementById('fileContent').textContent = csv;
    downloadJSON(generateJSONArray(CSVToArray(csv, ',')), 'output.json');
}

// function handleFileLoad2(event) {
//     const input = event.target.result;
//     const json = JSON.parse(input);
//     console.log(getRankings(json))
// }

function generateJSONArray(arr) {
    let output = [];
    arr.forEach(item => {
        if (!(item.length === 9)) return;
        output.push({
            gameID: item[0],
            homeID: item[1],
            homeWeightClass: Number(item[2]),
            homeScore: Number(item[4]),
            awayID: item[7],
            awayWeightClass: Number(item[8]),
            awayScore: Number(item[5])
        })
    })
    return output;
}

function downloadJSON(content, filename) {
    const a = document.createElement('a');
    const blob = new Blob([JSON.stringify(content)], {type: "text/plain;charset=utf-8"});

    a.href= URL.createObjectURL(blob);
    a.download = filename;
    a.click();

    URL.revokeObjectURL(a.href);
}
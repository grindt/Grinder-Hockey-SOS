//methods/classes required for showcase to work ===================================================================================================
class Output {
    outputItems = [];

    newOutputItem(teamID, teamName) {
        this.outputItems.push(new OutputItem(teamID, teamName));
        return this.outputItems.length - 1;
    }
}

class OutputItem {
    teamID = "";
    classWeight = "";
    name = "";
    GP = 0;
    wins = 0;
    losses = 0;
    ties = 0;
    GF = 0;
    GA = 0;
    AGD = 0.0;
    OW = 0.0;
    OOW = 0.0;
    SOS = 0.0;
    ranking = "";

    constructor(teamID = "", teamName = "") {
        this.teamID = teamID;
        this.name = teamName
    }
}

class Records {
    teamRecords = [];

    newTeamRecord(teamID, teamName) {
        this.teamRecords.push(new TeamRecord(teamID, teamName));
    }

    isTeamInTeamRecords(teamID) {
        return this.teamRecords.filter(team => team.teamID === teamID ).length > 0;
    }

    getTeamNameFromID(teamID) {
        return this.teamRecords[this.getTeamIndex(teamID)].teamName
    }

    getTeamFromID(teamID) {
        return this.teamRecords[this.getTeamIndex(teamID)]
    }

    getTeamIndex(teamID) {
        return this.teamRecords.findIndex(team => team.teamID === teamID);
    }

    updateScoreCards(homeTeamID, homeTeamScore, awayTeamID, awayTeamScore) {
        let homeTeamIndex = this.getTeamIndex(homeTeamID);
        let homeTeamOpIndex = this.teamRecords[homeTeamIndex].getOpIndex(awayTeamID);
        let awayTeamIndex = this.getTeamIndex(awayTeamID);
        let awayTeamOpIndex = this.teamRecords[awayTeamIndex].getOpIndex(homeTeamID);

        this.teamRecords[homeTeamIndex].totalGoalFor += Number(homeTeamScore);
        this.teamRecords[homeTeamIndex].totalGoalAgainst += Number(awayTeamScore);
        this.teamRecords[awayTeamIndex].totalGoalFor += Number(awayTeamScore);
        this.teamRecords[awayTeamIndex].totalGoalAgainst += Number(homeTeamScore);

        if (Number(homeTeamScore) > Number(awayTeamScore)) {
            this.teamRecords[homeTeamIndex].totalWins++;
            this.teamRecords[homeTeamIndex].oponenets[homeTeamOpIndex].wins++;

            this.teamRecords[awayTeamIndex].totalLosses++;
            this.teamRecords[awayTeamIndex].oponenets[awayTeamOpIndex].losses++;
        }
        if (Number(homeTeamScore) < Number(awayTeamScore)) {
            this.teamRecords[homeTeamIndex].totalLosses++;
            this.teamRecords[homeTeamIndex].oponenets[homeTeamOpIndex].losses++;

            this.teamRecords[awayTeamIndex].totalWins++;
            this.teamRecords[awayTeamIndex].oponenets[awayTeamOpIndex].wins++;
        }
        if (Number(homeTeamScore) === Number(awayTeamScore)) {
            this.teamRecords[homeTeamIndex].totalTies++;
            this.teamRecords[homeTeamIndex].oponenets[homeTeamOpIndex].ties++;

            this.teamRecords[awayTeamIndex].totalTies++;
            this.teamRecords[awayTeamIndex].oponenets[awayTeamOpIndex].ties++;
        }
    }
}

class TeamRecord {
    constructor(teamID = "", teamName = "") {
        this.teamID = teamID;
        this.teamName = teamName;
        this.oponenets = [];
        this.totalWins = 0;
        this.totalLosses = 0;
        this.totalTies = 0;
        this.totalGoalFor = 0;
        this.totalGoalAgainst = 0;
        this.classWeight = 0;
    }

    newOp(teamID) {
        this.oponenets.push(new Record(teamID))
    }

    isTeamInOps(teamID) {
        return this.oponenets.filter(op => op.teamID === teamID ).length > 0
    }

    getOpIndex(teamID) {
        return this.oponenets.findIndex(team => team.teamID === teamID)
    }

    getTeamInOps(teamID) {
        return this.oponenets[this.getOpIndex(teamID)]
    }
}

class Record {
    teamID = "";
    wins = 0;
    losses = 0;
    ties = 0;

    constructor(teamID = "") {
        this.teamID = teamID
    }
}

function CSVToArray( strData, strDelimiter ){
    strDelimiter = (strDelimiter || ",");
    var objPattern = new RegExp(
        (
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" + "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" + "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
        );
    var arrData = [[]];
    var arrMatches = null;
    while (arrMatches = objPattern.exec( strData )){
        var strMatchedDelimiter = arrMatches[ 1 ];
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
            ){
            arrData.push( [] );

            }

        var strMatchedValue;
        if (arrMatches[ 2 ]){
            strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
                );

        } else {
            strMatchedValue = arrMatches[ 3 ];
        }
        arrData[ arrData.length - 1 ].push( strMatchedValue );
    }
    return( arrData );
}

function init() {
    document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
}

function handleFileSelect(event) {
    const reader = new FileReader()
    reader.onload = handleFileLoad;
    reader.readAsText(event.target.files[0])
}

function handleFileLoad(event) {
    let csv = event.target.result;
    document.getElementById('fileContent').textContent = csv;

    let record = parseCSVIntoRecord(CSVToArray(csv, ','));
    printOutput(generateOutput(record));   
}

function generateOutput(record) {
    let output = new Output();

    record.teamRecords.forEach(rec => {
        outputItem = output.outputItems[output.newOutputItem(rec.teamID, rec.teamName)];

        outputItem.classWeight = 'todo';
        outputItem.GP = rec.totalLosses + rec.totalTies + rec.totalWins;
        outputItem.wins = rec.totalWins;
        outputItem.losses = rec.totalLosses;
        outputItem.ties = rec.totalTies;
        outputItem.GF = rec.totalGoalFor;
        outputItem.GA = rec.totalGoalAgainst;
        outputItem.AGD = (outputItem.GF - outputItem.GA) / outputItem.GP;
        outputItem.OW = calcOW(record, rec.teamID);
        outputItem.OOW = calcOOW(record, rec.teamID);
        outputItem.SOS = calcSOS(outputItem.OW, outputItem.OOW);
        outputItem.ranking = "todo";
    })

    return output;
}

function getCSVString(out) {
    return [
        [
            "teamID",
            "classWeight",
            "team name",
            "GP",
            "wins",
            "losses",
            "ties",
            "GF",
            "GA",
            "AGD",
            "OW",
            "OOW",
            "SOS",
            "ranking"
        ],
        ...out.outputItems.map(item => [
            item.teamID,
            item.classWeight,
            item.name,
            item.GP,
            item.wins,
            item.losses,
            item.ties,
            item.GF,
            item.GA,
            item.AGD,
            item.OW,
            item.OOW,
            item.SOS,
            item.ranking
        ])
    ]
}

function printOutput(out) {
    console.log(out)

    let csvString = getCSVString(out);

    let csvContent = "data:text/csv;charset=utf-8," + csvString.map(e => e.join(",")).join("\n");
    var encodedUri = encodeURI(csvContent);
    window.open(encodedUri);
}

function parseCSVIntoRecord(arr) {
    let record = new Records();

    // structure of csv input array
    // [GAME#(unique) , TeamID(home), ClassWeight(home), HOME TEAM, HOME SCORE, AWAY SCORE, AWAY TEAM, TeamID(away), ClassWeight(away)]
    arr.forEach(item => {
        if(!(item.length === 9)) return;

        let homeTeamID = item[1];
        let awayTeamID = item[7];
        let homeScore = item[4];
        let awayScore = item[5];

        //home team
        if(!record.isTeamInTeamRecords(homeTeamID)) record.newTeamRecord(homeTeamID, item[3]);
        if(!record.teamRecords[record.getTeamIndex(homeTeamID)].isTeamInOps(awayTeamID)) {
            record.teamRecords[record.getTeamIndex(homeTeamID)].newOp(awayTeamID);
        }

        //away team
        if(!record.isTeamInTeamRecords(awayTeamID)) record.newTeamRecord(awayTeamID, item[6]);
        if(!record.teamRecords[record.getTeamIndex(awayTeamID)].isTeamInOps(homeTeamID)) {
            record.teamRecords[record.getTeamIndex(awayTeamID)].newOp(homeTeamID);
        }

        record.updateScoreCards(homeTeamID, homeScore, awayTeamID, awayScore);
    });

    return record;
}

//end showcase methods ===========================================================================================================================

function calcOW(record, teamID) {
    let teams = record.teamRecords.filter(team => {
        return (
            !(team.teamID === teamID) &&
            team.oponenets.filter(op => op.teamID === teamID).length > 0
        )
    });

    let oppW = 0;
    teams.forEach(team => {
        let reduceTeam = team.getTeamInOps(teamID);
        let reduceTotalGames = (reduceTeam.wins + reduceTeam.losses);
        let totalGames = (team.totalWins + team.totalLosses) - reduceTotalGames;
        let wins = team.totalWins - reduceTeam.wins;

        if (totalGames > 0) oppW += (reduceTotalGames * (wins / totalGames));
    })

    let team = record.teamRecords[record.getTeamIndex(teamID)];
    return oppW / (team.totalWins + team.totalLosses + team.totalTies)
}

function calcOOW(record, teamID) {
    let teams = record.teamRecords.filter(team => {
        return (
            !(team.teamID === teamID) &&
            team.oponenets.filter(op => op.teamID === teamID).length > 0
        )
    });

    let oow = 0;
    teams.forEach(team => {
        let mult = 0;
        team.oponenets.forEach(opTeam => {
            if(record.getTeamNameFromID(opTeam.teamID) === record.getTeamNameFromID(teamID)) mult = (opTeam.wins + opTeam.ties + opTeam.losses);
        });

        oow += (mult * calcOW(record, team.teamID));
    })
    let team = record.getTeamFromID(teamID);
    return oow / (team.totalWins + team.totalLosses + team.totalTies);
}

function calcSOS(OW, OOW) {
    return ((2 * Number(OW)) + Number(OOW)) / 3;
}

function calcRankings(SoS, CW, AGD) {
    let ranking = SoS + CW + AGD
    return ranking
}
// Weight Class Spread
const PLATINUM = 100;
const GOLD = 90;
const SILVER = 80;
const BRONZE = 70;
const WOOD = 60;
const NIL = 50;

const WIDEST_GOAL_GAP = 9;

// make sure games for ranking is > min games for class
const MIN_GAMES_FOR_RANKING = 5;
const MIN_GAMES_FOR_CLASS = 5;

const SoS_FACTOR = 50;
const CW_FACTOR = 1.0;
const AGD_FACTOR = 5;




class Output {
    outputItems = [];

    newOutputItem(teamID, teamName) {
        this.outputItems = [...this.outputItems, new OutputItem(teamID, teamName)];
        return this.outputItems[this.outputItems.length - 1];
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

    newTeamRecord(teamID, teamName, teamWeight) {
        this.teamRecords = [...this.teamRecords, new TeamRecord(teamID, teamName, teamWeight)]
        return this.teamRecords[this.teamRecords.length - 1]
    }

    getTeamNameFromID(teamID) {
        return this.teamRecords[this.getTeamIndex(teamID)].teamName
    }

    getTeamFromID(teamID) {
        return this.teamRecords[this.getTeamIndex(teamID)] ?? undefined;
    }

    getTeamIndex(teamID) {
        return this.teamRecords.findIndex(team => team.teamID === teamID);
    }

    getOpponentTeams(team) {
        return this.teamRecords.filter(t => {
            return (
                !(t.teamID === team.teamID) &&
                t.opponents.filter(opp => opp.teamID === team.teamID).length > 0
            )
        });
    }

    doMorph(teams, upperWin, upperLoss, upperTie, lowerWin, lowerLoss, lowerTie) {
        if(teams.upperClassScore > teams.lowerClassScore) {
            teams.upperClassTeam.classWeight += upperWin;
            teams.lowerClassTeam.classWeight += lowerLoss;
        }
        else if(teams.upperClassScore < teams.lowerClassScore) {
            teams.upperClassTeam.classWeight += upperLoss;
            teams.lowerClassTeam.classWeight += lowerWin;
        }
        else {
            teams.upperClassTeam.classWeight += upperTie;
            teams.lowerClassTeam.classWeight += lowerTie;
        }

        if(teams.upperClassTeam.classWeight > PLATINUM + (PLATINUM * 0.05)) {
            teams.upperClassTeam.classWeight = PLATINUM + (PLATINUM * 0.05);
        }
        if(teams.lowerClassTeam.classWeight < NIL - (NIL * 0.1)) {
            teams.lowerClassTeam.classWeight = NIL - (NIL * 0.1);
        }
    }
    morphClassWeights(upperClassTeam, upperClassScore, lowerClassTeam, lowerClassScore) {
        const weightDiff = upperClassTeam.weight - lowerClassTeam.weight;
        const goalDiff = Math.abs(upperClassScore - lowerClassScore);
        let teams = {upperClassTeam, upperClassScore, lowerClassTeam, lowerClassScore}

        if(weightDiff === 0) {
            if(goalDiff > 16) {
                this.doMorph(teams, 0.75, -0.75, 0, 0.75, -0.75, 0);
            }
            else if(goalDiff > 8) {
                this.doMorph(teams, 0.25, -0.25, 0, 0.25, -0.25, 0);
            }
        }
        else if(weightDiff < 7.5) {
            if(goalDiff > 16) {
                this.doMorph(teams, 0.75, -1.5, 0, 1.5, -0.75, 0);
            }
            else if(goalDiff > 8) {
                this.doMorph(teams, 0.25, -0.5, 0, 0.5, -0.25, 0);
            }
        }
        else if(weightDiff < 15) {
            if(goalDiff === 0) {
                this.doMorph(teams, 0, 0, -0.5, 0, 0, 0.5);
            }
            else if(goalDiff <= 8) {
                this.doMorph(teams, -0.75, -1.5, -0.5, 1.5, 0.75, 0.5);
            }
            else if(goalDiff > 16) {
                this.doMorph(teams, 0.25, -3.5, -0.5, 5.0, -0.25, 0.5);
            }
            else if(goalDiff > 8) {
                this.doMorph(teams, 0, -2.5, -0.5, 3.5, 0, 0.5);
            }
        }
        else if(weightDiff < 22.5) {
            if(goalDiff === 0) {
                this.doMorph(teams, 0, 0, -0.75, 0, 0, 2.0);
            }
            else if(goalDiff <= 8) {
                this.doMorph(teams, -1.5, -3.5, -0.75, 4.0, 1.5, 2.0);
            }
            else if(goalDiff > 16) {
                this.doMorph(teams, 0, -6.5, -0.75, 8.0, 0, 2.0);
            }
            else if(goalDiff > 8) {
                this.doMorph(teams, -0.5, -5.0, -0.75, 6.0, 0.5, 2.0);
            }
        }
        else {
            if(goalDiff === 0) {
                this.doMorph(teams, 0, 0, -1.5, 0, 0, 3.75);
            }
            else if(goalDiff <= 8) {
                this.doMorph(teams, -3.0, -5.0, -1.5, 7.5, 3.0, 3.75);
            }
            else if(goalDiff > 16) {
                this.doMorph(teams, 0, -8.0, -1.5, 12.5, 0, 3.75);
            }
            else if(goalDiff > 8) {
                this.doMorph(teams, -1.5, -6.5, -1.5, 10.0, 1.5, 3.75);
            }
        }
    }

    handlePreWeightGame(homeTeam, homeScore, awayTeam, awayScore) {
        if(homeTeam.classWeight === 0) {
            homeTeam.preWeightGames++;
            if(Math.abs(homeScore - awayScore) < 10) {
                homeTeam.preWeightAvg += awayTeam.classWeight;
            } else if(homeScore > awayScore) {
                homeTeam.preWeightAvg += getNextUpperRank(awayTeam.classWeight);
            } else if(homeScore < awayScore){
                homeTeam.preWeightAvg += getNextLowerRank(awayTeam.classWeight);
            }
        } else {
            awayTeam.preWeightGames++;
            if(Math.abs(homeScore - awayScore) < 10) {
                awayTeam.preWeightAvg += homeTeam.classWeight;
            } else if(awayScore > homeScore) {
                awayScore.preWeightAvg += getNextUpperRank(homeScore.classWeight);
            } else if(awayScore < homeScore){
                awayScore.preWeightAvg += getNextLowerRank(homeScore.classWeight);
            }
        }
    }

    handleNoClassWeight(homeTeam, homeScore, awayTeam, awayScore) {
        if((homeTeam.classWeight === 0 && homeTeam.totalGames > MIN_GAMES_FOR_CLASS) ||
          (awayTeam.classWeight === 0 && awayTeam.totalGames > MIN_GAMES_FOR_CLASS) ||
          (homeTeam.classWeight === 0 && awayTeam.classWeight === 0))
        { return }

        if(homeTeam.classWeight === 0 && homeTeam.totalGames + 1 === MIN_GAMES_FOR_CLASS) {
            this.handlePreWeightGame(homeTeam, homeScore, awayTeam, awayScore);
            homeTeam.classWeight = (homeTeam.preWeightGames > 0) ? homeTeam.preWeightAvg / homeTeam.preWeightGames : 0;
            return;
        }
        if(awayTeam.classWeight === 0 && awayTeam.totalGames + 1 === MIN_GAMES_FOR_CLASS) {
            this.handlePreWeightGame(homeTeam, homeScore, awayTeam, awayScore);
            awayTeam.classWeight = (awayTeam.preWeightGames > 0) ? awayTeam.preWeightAvg / awayTeam.preWeightGames : 0;
            return;
        }
        this.handlePreWeightGame(homeTeam, homeScore, awayTeam, awayScore);
    }

    updateClassWeights(homeTeam, homeScore, awayTeam, awayScore) {
        if(homeTeam.classWeight === 0 || awayTeam.classWeight === 0) {
            this.handleNoClassWeight(homeTeam, homeScore, awayTeam, awayScore);
            return;
        }

        (homeTeam.classWeight > awayTeam.classWeight) ?
            this.morphClassWeights(homeTeam, homeScore, awayTeam, awayScore) :
            this.morphClassWeights(awayTeam, awayScore, homeTeam, homeScore)
    }

    updateScoreCards(homeTeam, homeTeamScore, awayTeam, awayTeamScore) {
        let homeTeamAGDScore = homeTeamScore;
        let awayTeamAGDScore = awayTeamScore;

        if(Math.abs(homeTeamScore - awayTeamScore) > WIDEST_GOAL_GAP) {
            const goalDelta = Math.abs(homeTeamScore - awayTeamScore) - WIDEST_GOAL_GAP;
            (homeTeamScore > awayTeamScore) ? homeTeamAGDScore -= goalDelta : awayTeamAGDScore -= goalDelta
        }

        homeTeam.totalGoalFor += Number(homeTeamAGDScore);
        homeTeam.totalGoalAgainst += Number(awayTeamAGDScore);
        awayTeam.totalGoalFor += Number(awayTeamAGDScore);
        awayTeam.totalGoalAgainst += Number(homeTeamAGDScore);

        homeTeam.totalGames++;
        awayTeam.totalGames++;

        const homeTeamOpp = homeTeam.getTeamInOps(awayTeam);
        const awayTeamOpp = awayTeam.getTeamInOps(homeTeam);
        if (Number(homeTeamScore) > Number(awayTeamScore)) {
            homeTeam.totalWins++;
            homeTeamOpp.wins++;
            awayTeam.totalLosses++;
            awayTeamOpp.losses++;
        }
        if (Number(homeTeamScore) < Number(awayTeamScore)) {
            homeTeam.totalLosses++;
            homeTeamOpp.losses++;
            awayTeam.totalWins++;
            awayTeamOpp.wins++;
        }
        if (Number(homeTeamScore) === Number(awayTeamScore)) {
            homeTeam.totalTies++;
            homeTeamOpp.ties++;
            awayTeam.totalTies++;
            awayTeamOpp.ties++;
        }
    }
}

class TeamRecord {
    constructor(teamID = "", teamName = "", classWeight = 0) {
        this.teamID = teamID;
        this.teamName = teamName;
        this.opponents = [];
        this.totalWins = 0;
        this.totalLosses = 0;
        this.totalTies = 0;
        this.totalGames = 0;
        this.totalGoalFor = 0;
        this.totalGoalAgainst = 0;
        this.preWeightGames = 0;
        this.preWeightAvg = 0;
        this.classWeight = classWeight;
    }

    newOp(teamID) {
        this.opponents.push(new Record(teamID))
    }

    isTeamInOps(teamID) {
        return this.opponents.filter(op => op.teamID === teamID ).length > 0
    }

    getOppIndex(teamID) {
        return this.opponents.findIndex(team => team.teamID === teamID)
    }

    getTeamInOps(oppTeam) {
        return this.opponents[this.getOppIndex(oppTeam.teamID)]
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

function getNextUpperRank(weight) {
    if(weight < NIL) return NIL;
    if(weight < WOOD) return WOOD;
    if(weight < BRONZE) return BRONZE;
    if(weight < SILVER) return SILVER;
    if(weight < GOLD) return GOLD;
    if(weight < PLATINUM) return PLATINUM;
    return weight;
}

function getNextLowerRank(weight) {
    if(weight > PLATINUM) return PLATINUM;
    if(weight > GOLD) return GOLD;
    if(weight > SILVER) return SILVER;
    if(weight > BRONZE) return BRONZE;
    if(weight > WOOD) return WOOD;
    if(weight > NIL) return NIL;
    return weight;
}

function CSVToArray(strData, strDelimiter){
    const objPattern = new RegExp((
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" + "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" + "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ), "gi"
    );
    let output = [[]];
    let arrMatches = null;
    while (arrMatches = objPattern.exec(strData)){
        let strMatchedDelimiter = arrMatches[1];
        if (strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter) output.push([]);

        let strMatchedValue;
        (arrMatches[2]) ?
            strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"") :
            strMatchedValue = arrMatches[3];

        output[output.length - 1].push(strMatchedValue);
    }
    return output;
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
    const csv = event.target.result;
    document.getElementById('fileContent').textContent = csv;
    const record = parseCSVIntoRecord(CSVToArray(csv, ','));
    printOutput(generateOutput(record));
}

function generateOutput(record) {
    let output = new Output();
    record.teamRecords.forEach(team => {
        let outputItem = output.newOutputItem(team.teamID, team.teamName);

        outputItem.classWeight = team.classWeight;
        outputItem.GP = team.totalGames;
        outputItem.wins = team.totalWins;
        outputItem.losses = team.totalLosses;
        outputItem.ties = team.totalTies;
        outputItem.GF = team.totalGoalFor;
        outputItem.GA = team.totalGoalAgainst;
        outputItem.AGD = (outputItem.GF - outputItem.GA) / outputItem.GP;
        outputItem.OW = calcOW(record, team);
        outputItem.OOW = calcOOW(record, team);
        outputItem.SOS = calcSOS(outputItem.OW, outputItem.OOW);
        outputItem.ranking = (team.classWeight > 0) ? calcRankings(outputItem.SOS, team.classWeight, outputItem.AGD) : "Bad Class Weight";
    })
    return output;
}

function getCSVString(out) {
    return [
        [
            "TeamID",
            "Class Weight",
            "Class Name",
            "Team Name",
            "GP",
            "Wins",
            "Losses",
            "Ties",
            "GF",
            "GA",
            "AGD",
            "OW",
            "OOW",
            "SOS",
            "Ranking"
        ],
        ...out.outputItems.map(item => [
            item.teamID,
            item.classWeight,
            getClassName(item.classWeight),
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
            (item.GP >= MIN_GAMES_FOR_RANKING) ? item.ranking : "Not Enough Games"
        ])
    ]
}

function getClassName(weight) {
    if(weight < NIL) return 'NIL';
    if(weight < WOOD) return 'Wood';
    if(weight < BRONZE) return 'Bronze';
    if(weight < SILVER) return 'Silver';
    if(weight < GOLD) return 'Gold';
    if(weight >= GOLD) return 'Platinum';
}

function printOutput(output) {
    console.log(output)
    const csvContent = "data:text/csv;charset=utf-8," + getCSVString(output).map(e => e.join(",")).join("\n");
    window.open(encodeURI(csvContent));
}

function addTeamToRecord(record, teamID, teamWeight, teamName, oppTeamID) {
    let team = record.getTeamFromID(teamID)
    if(team === undefined) team = record.newTeamRecord(teamID, teamName, teamWeight);
    if(!team.isTeamInOps(oppTeamID)) team.newOp(oppTeamID);
    return team;
}

function parseCSVIntoRecord(csvArray) {
    let record = new Records();

    // structure of csv array
    // [[GAME#(unique) , TeamID(home), ClassWeight(home), HOME TEAM, HOME SCORE, AWAY SCORE, AWAY TEAM, TeamID(away), ClassWeight(away)], ...]
    csvArray.forEach(item => {
        if(!(item.length === 9)) return;

        let homeTeamID     = item[1];
        let homeTeamWeight = item[2];
        let homeTeamName   = item[3];
        let homeScore      = item[4];
        let awayScore      = item[5];
        let awayTeamName   = item[6];
        let awayTeamID     = item[7];
        let awayTeamWeight = item[8];

        let homeTeam = addTeamToRecord(record, homeTeamID, Number(homeTeamWeight), homeTeamName, awayTeamID);
        let awayTeam = addTeamToRecord(record, awayTeamID, Number(awayTeamWeight), awayTeamName, homeTeamID);

        record.updateClassWeights(homeTeam, homeScore, awayTeam, awayScore);
        record.updateScoreCards(homeTeam, homeScore, awayTeam, awayScore);
    });

    return record;
}

//end showcase methods ===========================================================================================================================

function getOppOppWinPercent(record, oppTeams, team) {
    let oppOppW = 0;
    oppTeams.forEach(oppTeam => {
        let multi = 0;
        oppTeam.opponents.forEach(oppOppTeam => {
            if(record.getTeamNameFromID(oppOppTeam.teamID) === team.teamName) multi = (oppOppTeam.wins + oppOppTeam.ties + oppOppTeam.losses);
        });

        oppOppW += (multi * calcOW(record, oppTeam));
    })
    return oppOppW;
}

function getOppWinPercent(record, oppTeams, team) {
    let oppW = 0;
    oppTeams.forEach(oppTeam => {
        const reduceTeam = oppTeam.getTeamInOps(team);
        const reduceTotalGames = (reduceTeam.wins + reduceTeam.losses);
        const totalCountedGames = (oppTeam.totalWins + oppTeam.totalLosses) - reduceTotalGames;
        const countedWins = oppTeam.totalWins - reduceTeam.wins;

        if (totalCountedGames > 0) oppW += (reduceTotalGames * (countedWins / totalCountedGames));
    })
    return oppW;
}

function calcOW(record, team) {
    const oppWinPercent = getOppWinPercent(record, record.getOpponentTeams(team), team);
    return oppWinPercent / team.totalGames
}

function calcOOW(record, team) {
    const oppOppWinPercent = getOppOppWinPercent(record, record.getOpponentTeams(team), team);
    return oppOppWinPercent / team.totalGames;
}

function calcSOS(OW, OOW) {
    return ((2 * Number(OW)) + Number(OOW)) / 3;
}

function calcRankings(SoS, CW, AGD) {
    return (SoS * SoS_FACTOR) + (CW * CW_FACTOR) + (AGD * AGD_FACTOR);
}
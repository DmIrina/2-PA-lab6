var gameField = [1,2,3,4,5,6,7,8,9]
var playerOneScore = 0;
var playerTwoScore = 0;
var counter = 1;
var currentRollResult = 0;

document.getElementById('current-turn').innerHTML = "Player HUMAN";

// function display_sum(nums) {
// 	document.getElementById('sum').innerText = nums[0]+nums[1];
// }

window.onclick = event => {
    if (event.target.classList.contains('roll-button')) {
        let numbers = rollDice();                               // підкинути кубики
        currentRollResult = (numbers[0] + numbers[1]);          // сума

        setTimeout(function(){                                      // заповнити поля з викинутою сумою
            document.querySelector('.roll-result-number').innerHTML= (currentRollResult);
            document.getElementById('sum').innerText = currentRollResult;
        }, 2000);

        witchCanBeChecked(currentRollResult);           // визначити ячейки, які можна обрати (виходячи з викинутої суми) - білі

        let endgame = checkForEndGame();                // перевірка на кінець гри, повернуться штрафи
        if(endgame !== false) {                         // завершити гру (тур)
            const dice1 = document.getElementById("die-1").dataset.roll = numbers[0];   // ще раз прокрутити
            const dice2 = document.getElementById("die-2").dataset.roll = numbers[1];
            if (counter === 1) {                    // Завершився Перший тур - ЛЮДИНВ
                playerOneScore = endgame;
            } else {
                playerTwoScore = endgame;           // КОМП завершив 2 тур
                sleep(2000).then(r => showEndResult());
                showEndResult();
                location.reload();          // завершити гру
            }
            sleep(2000).then(r => startNextTurn(endgame));          // гра переходить до АІ
        }
    }

    if (event.target.classList.contains('number-checkbox')) {           // помічаємо поля на екрані залежно від їх стану та можливості вибору
        if (document.getElementById(event.target.id).checked) {
            let next = (currentRollResult - event.target.id);
            document.getElementById(event.target.id).checked = true;
            document.getElementById(next).checked = true;
            gameField[Number(event.target.id)-1] = 0;
            gameField[next-1] = 0;
            disableAll();
        }
    }
}

const startNextTurn = async (endgame) => {
    alert('ЛЮДИНА завершила тур з '+ endgame + ' штрафними очками');
    gameField = [1,2,3,4,5,6,7,8,9];
    document.getElementById('current-turn').innerHTML = "AI";
    document.querySelector('.roll-result-number').innerHTML = '0';
    counter++;                                                               // 2 тур
    for (let i = 1; i <= 9; i++) {                                          // init checkboxes
        document.getElementById(i).disabled = true;
        document.getElementById(i).checked = false;
    }

    let iter = true;
    while(iter) {                                               // цикл поки є куди ходити
        document.querySelector('.roll-button').click();  // програмно клик кнопку
        let endgame_result = checkForEndGame();

        if (endgame_result === false) {                         // не кінець гри
            let next_turn = StartAlgorithm();                   // поверне масив з 2 елементів
            document.getElementById(next_turn[0]).click();
            gameField[next_turn[0]-1] = 0;
            gameField[next_turn[1]-1] = 0;
            console.log('3 сек затримка..');
            await sleep(3000);
        } else {
            iter = !iter;                                   // КІНЕЦЬ ГРИ
        }
    }
}

const checkForEndGame = () => {
    let score = 0;
    for (let i = 1; i <= 9; i++) {
        let currentSquare = document.getElementById(i);    // перебрати 9 чекбоксів
        if (currentSquare.disabled === false){              // перевірка на закриті/недосяжні ячейки
            return false;                                   // є куди ходити
        }
        if (currentSquare.checked === false){               // підрахунок штрафних балів
            score += Number(currentSquare.id);
        }
    }
    return score;
}


// function to find best turn
function StartAlgorithm() {
    let next_turn;
    let start = currentRollResult;
    let available = availableTurns(start).slice();
    let bestTurn = 45;                          // 1 + 2 + 3 + ...

    for (let i = 0; i < available.length; i++) {
        gameField[available[i].first-1] = 0;
        gameField[available[i].second-1] = 0;
        let temp_field = gameField.slice();
        for (let j = 3; j <= 12; j++) {
            let turn = expectimax(j, temp_field, 4);
            if (turn < bestTurn) {
                bestTurn = turn;
                next_turn = [available[i].first, available[i].second];
            }
        }

        console.log(bestTurn);
        gameField[available[i].first-1] = available[i].first;
        gameField[available[i].second-1] = available[i].second;
    }
    return next_turn;
}

// перевірка наявності вільних ячеек
// start - сума 2 кубиків
const availableTurns = (start) => {
    let temp_array = gameField.slice();
    let array = [];
    for (let i = 0; i < temp_array.length; i++) {
        if (temp_array[i] !== 0) {                          // ячейка не вибрана
            if (start / 2 !== temp_array[i]) {              // другої такої ж ячейки немає
                if (start - temp_array[i] < 10) {           // 12: (1,9), (2, 9)... вимкнути
                    if (start - temp_array[i] === temp_array[start - temp_array[i] - 1]) {
                        array.push({first: temp_array[i], second: temp_array[start - temp_array[i] - 1]});
                        temp_array[i] = 0;
                        temp_array[start - temp_array[i] - 1] = 0;
                    }
                }
            } 
        }
    }
    return array;
}

// main function
function expectimax(start, field, depth) {
    let available = availableTurns(start).slice();              // доступні пари ходів
    if (available.length === 0 || depth === 0) {
        let score = 0;
        for (let i = 0; i < field.length; i++) {
            score += field[i];
        }
        return score;
    }
    let bestTurn = 45;
        for (let i = 0; i < available.length; i++) {
            field[available[i].first] = 0;
            field[available[i].second] = 0;
            for (let j = 3; j <= 12; j++) {                       // перебор усіх допустимих  варіантів сум (1:1, 1:0 - нема ходів)
                let turn = expectimax(j, field, depth-1);   // рекурсивно шукає найкращий результат (найменшу кількість штраф балів)
                if (turn < bestTurn) {
                    bestTurn = turn;
                }
            }
            field[available[i].first] = available[i].first;
            field[available[i].second] = available[i].second;
        }
        return bestTurn;
}


// Початкова ініціалізація поля
const fillPage = () => {
    for (let i = 0; i < gameField.length; i++) {
        document.querySelector('.field').innerHTML += `
        <div class="field-item">
            <div class="field-item__number">
                <span>`+ gameField[i] +`</span>
            </div>
            <div class="field-item__button">
                <input type="checkbox" class="number-checkbox" id="`+ gameField[i] +`">
            </div>
        </div>
        `
        document.getElementById(gameField[i]).disabled = true;
    }
}

fillPage();


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



const showEndResult = () => {
    if (playerOneScore < playerTwoScore) {
        alert('Виграла ЛЮДИНА!' + 'Нараховано штарфних балів: ЛЮДИНА = ' + playerOneScore + '; АІ = ' + playerTwoScore);
    } else if (playerOneScore === playerTwoScore) {
        alert('НІЧИЯ!'+' Нараховано кожному  штарфних балів  - ' + playerOneScore);
    } else if (playerOneScore > playerTwoScore) {
        alert('АІ ВИГРАВ! '+ 'Нараховано штарфних балів: Людина = ' + playerOneScore + '; АІ = ' + playerTwoScore);
    }
}


// визначити ячейки, які можна обрати (виходячи з викинутої суми)
const witchCanBeChecked = (number) => {
    let alreadyChecked = [];

    let len = (number > 10) ? 10: number;
   
    for (let i = 1; i < len; i++) {
        if (number / 2 !== i) {
            if (document.getElementById(i).checked !== true) {
                document.getElementById(i).disabled = false;
            } else {
                alreadyChecked.push(i);
            }
        }
    }
    for (let i = 0; i < alreadyChecked.length; i++) {
        let num = alreadyChecked[i];
        try {
            document.getElementById(number - num).disabled = true;
        } catch (error) {
            
        }
        
    }
    if (number > 10) {
        for (let i = 1; i <= number - 10; i++) {
            document.getElementById(i).disabled = true;
        }
    }
}

const disableAll = () => {
    for (let i = 1; i <= 9; i++) {
        document.getElementById(i).disabled = true;
    }
}
disableAll();



// function getRandomInt(min, max) {
//     return Math.floor(Math.random() * (max - min) + min);
// }


function rollDice() {
    const dice = [...document.querySelectorAll(".die-list")];
    let sum = 0;
    let i = 0;
    let nums= [];
    dice.forEach(die => {
        toggleClasses(die);
        nums[i] = getRandomNumber(1, 6);
		console.log(nums);
        die.dataset.roll = nums[i];
        i++;
    });

return nums;
}


function toggleClasses(die) {
    die.classList.toggle("odd-roll");
    die.classList.toggle("even-roll");
}

function getRandomNumber(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


// document.getElementById("roll-button").addEventListener("click", rollDice);

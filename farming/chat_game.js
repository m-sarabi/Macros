function solveMathProblem(text) {
    var failed = false;
    if (text.includes('→') || !text.includes("'")) {
        return;
    } else if (text.includes("The first to type")) {
        var answer = text.split("'")[1];
        answer = answer.toLowerCase();

        Client.waitTick(Math.floor(Math.random() * 15 + 40));
        Chat.say(answer);
    } else if (text.includes("The first to unreverse")) {
        var answer = text.split("'")[1];
        answer = answer.split("").reverse().join("");
        answer = answer.toLowerCase();
        Client.waitTick(Math.floor(Math.random() * 15 + 44));
        Chat.say(answer);
    }
    else {
        const problem = text.split("'")[1];
        if (problem.includes('x')) {
            const numbers = problem.split(' x ');
            numbers.forEach((val, i) => {
                if (isNaN(numbers[i])) failed = true;
                numbers[i] = Number(val);
            });
            Client.waitTick(Math.floor(Math.random() * 10 + 30));
            if (!failed) Chat.say(String(numbers[0] * numbers[1]));
        } else if (problem.includes('+')) {
            const numbers = problem.split(' + ');
            numbers.forEach((val, i) => {
                if (isNaN(numbers[i])) failed = true;
                numbers[i] = Number(val);
            });
            Client.waitTick(Math.floor(Math.random() * 15 + 34));
            if (!failed) Chat.say(String(numbers[0] + numbers[1]));
        }
    }
}

text = event.text.getString();
solveMathProblem(text);

/* Example of unshuffle to right order
[20:47:04] [Render thread/INFO]: [System] [CHAT]                              › Chat Game ‹ 
[20:47:04] [Render thread/INFO]: [System] [CHAT]                                        
[20:47:04] [Render thread/INFO]: [System] [CHAT]                 The first to unshuffle 'Leaves Birch'
[20:47:04] [Render thread/INFO]: [System] [CHAT]                     back to the right order wins! 
 */

/* Fill in numbers
[21:17:07] [Render thread/INFO]: [System] [CHAT] 
[21:17:07] [Render thread/INFO]: [System] [CHAT]                              › Chat Game ‹ 
[21:17:07] [Render thread/INFO]: [System] [CHAT]                                        
[21:17:07] [Render thread/INFO]: [System] [CHAT]                  The first to fill in '01_3___789' wins!
[21:17:07] [Render thread/INFO]: [System] [CHAT]                  (make sure to only type the missing
[21:17:07] [Render thread/INFO]: [System] [CHAT]                                  letters) 
[21:17:07] [Render thread/INFO]: [System] [CHAT] 
*/

/* fill in letters
[21:47:12] [Render thread/INFO]: [System] [CHAT] 
[21:47:12] [Render thread/INFO]: [System] [CHAT]                              › Chat Game ‹ 
[21:47:12] [Render thread/INFO]: [System] [CHAT]                                        
[21:47:12] [Render thread/INFO]: [System] [CHAT]                  The first to fill in 'Co__ed _orkc__p'
[21:47:12] [Render thread/INFO]: [System] [CHAT]                                     wins! 
[21:47:12] [Render thread/INFO]: [System] [CHAT]                  (make sure to only type the missing
[21:47:12] [Render thread/INFO]: [System] [CHAT]                                  letters) 
[21:47:12] [Render thread/INFO]: [System] [CHAT] 
*/

/* unscramble
[00:47:40] [Render thread/INFO]: [System] [CHAT] 
[00:47:40] [Render thread/INFO]: [System] [CHAT]                              › Chat Game ‹ 
[00:47:40] [Render thread/INFO]: [System] [CHAT]                                        
[00:47:40] [Render thread/INFO]: [System] [CHAT]                The first to unscramble 'dSrriet' wins!
[00:47:40] [Render thread/INFO]: [System] [CHAT] 
*/

/* unshuffle & unreverse
[01:17:44] [Render thread/INFO]: [System] [CHAT] 
[01:17:44] [Render thread/INFO]: [System] [CHAT]                              › Chat Game ‹ 
[01:17:44] [Render thread/INFO]: [System] [CHAT]                                        
[01:17:44] [Render thread/INFO]: [System] [CHAT]                  The first to unshuffle & unreverse
[01:17:44] [Render thread/INFO]: [System] [CHAT]          'exakciP nedooW' back to the right order wins! 
[01:17:44] [Render thread/INFO]: [System] [CHAT] 
*/
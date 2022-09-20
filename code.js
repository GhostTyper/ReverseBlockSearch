const calcButton = document.getElementById('calcButton');
const dateInput = document.getElementById('dateInput');
const timeInput = document.getElementById('timeInput');
const resultDiv = document.getElementById('resultPlane');
const blockBefore = document.getElementById('blockBefore');
const blockAfter = document.getElementById('blockAfter');
const timeBefore = document.getElementById('timeBefore');
const timeAfter = document.getElementById('timeAfter');
const hashBefore = document.getElementById('hashBefore');
const hashAfter = document.getElementById('hashAfter');
const executionTime = document.getElementById('executionTime');

function getGenesisBlock() {
    return { "block": 0, "time": 1438226773, "hash": "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3" };
}

async function getCurrentBlock() {
    const request = { "id": 1, "jsonrpc": "2.0", "method": "eth_blockNumber", "params": [] };

    const response = await fetch('https://eth.ghosttyper.io', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    const data = await response.json();

    const resultArray = data.result.split('x');

    if (resultArray.length != 2) {
        throw new Error("Invalid result");
    }

    return await getBlock(parseInt(resultArray[1], 16));
}

async function getBlock(blockNumber) {
    const request = { "id": 1, "jsonrpc": "2.0", "method": "eth_getBlockByNumber", "params": ["0x" + blockNumber.toString(16), false] };

    const response = await fetch('https://eth.ghosttyper.io', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    const data = await response.json();

    let resultArray = data.result.timestamp.split('x');

    if (resultArray.length != 2) {
        throw new Error("Invalid result");
    }

    const time = parseInt(resultArray[1], 16);

    resultArray = data.result.number.split('x');

    if (resultArray.length != 2) {
        throw new Error("Invalid result");
    }

    return { "block": parseInt(resultArray[1], 16), "time": time, "hash": data.result.hash };
}

function anticipateBlock(min, max, minStamp, maxStamp, target) {
    const position = (target - minStamp) / (maxStamp - minStamp);
    const result = (min + (max - min) * position) | 0;

    if (result <= min)
        return min + 1;

    if (result >= max)
        return max - 1;

    return result;
}

async function resolveNearestBlocks(stamp) {
    let before = await getGenesisBlock();
    let after = await getCurrentBlock();
    let current;

    let next;

    while (before.block + 1 != after.block) {
        next = anticipateBlock(before.block, after.block, before.time, after.time, stamp);

        current = await getBlock(next);

        if (current.time > stamp)
            after = current;
        else
            before = current; 
    }

    return [ before, after ];
}

function formatDateTime(stamp) {
    const rStamp = new Date(stamp * 1000);

    return rStamp.getUTCFullYear() + "-" + String(rStamp.getUTCMonth() + 1).padStart(2, '0') + "-" + String(rStamp.getUTCDate()).padStart(2, '0') + " " + String(rStamp.getUTCHours()).padStart(2, '0') + ":" + String(rStamp.getUTCMinutes()).padStart(2, '0') + ":" + String(rStamp.getUTCSeconds()).padStart(2, '0');
}

function handleClick() {
    const targetTime = ((dateInput.valueAsNumber + timeInput.valueAsNumber) / 1000) | 0;

    calcButton.disabled = true;
    executionTime.textContent = " (Please wait.)";

    const start = Date.now();

    resolveNearestBlocks(targetTime).then((result) => {
        blockBefore.textContent = result[0].block;
        blockAfter.textContent = result[1].block;

        timeBefore.textContent = formatDateTime(result[0].time);
        timeAfter.textContent = formatDateTime(result[1].time);

        hashBefore.textContent = result[0].hash;
        hashAfter.textContent = result[1].hash;

        executionTime.textContent = " (Took " + ((Date.now() - start) / 1000) + " ms.)";

        resultDiv.style.display = "block";
        calcButton.disabled = false;
        
    }).catch((error) => {
        alert("Irgendetwas ist schiefgelaufen:\n\n" + error);
        executionTime.textContent = "";
        calcButton.disabled = false;
    });
}

{
    calcButton.addEventListener('click', handleClick);

    let now = Date.now();

    now = now - (now % 86400000) + 86400000;

    dateInput.max = new Date(now).toISOString().split("T")[0];
}
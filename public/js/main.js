/* eslint-disable */
async function callApi() {
    let sensors = await fetch('data/sensors.json?t=' + Date.now(), {
        method: 'Get',
    }).then((res) => res.json());

    fetch('data/data.json?t=' + Date.now(), {
        method: 'Get',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then((res) => res.json())
        .then((data) => {
            // interval 처리를 위한 자식 노드 초기화
            let pElem = document.querySelector('.status-first').parentElement;
            const pDiv = document.getElementById('devices');

            pDiv.querySelector('ul').innerHTML = '';
            pDiv.querySelector('ul').appendChild(pElem);

            // 데이터 화면 append
            const jsonData = data.data;
            // const keys = Object.keys(jsonData);
            // 센서 이관 중에는 아직 값이 없는 센서가 있다. 그 센서는 건너뛰고, 한 센서가 깨져도 나머지는 그린다.
            sensors.data.forEach((item) => {
                const sensorData = jsonData[item.source];
                if (!sensorData) return;
                try {
                    appendInfoArea({
                        accuracy: item.accuracy,
                        ...sensorData,
                    });
                } catch (e) {
                    console.error('센서 표시 실패:', item.source, e);
                }
            });
        });
}

function getDate(time) {
    const now = new Date(time);
    const dayNm = '일월화수목금토';
    return `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now
        .getDate()
        .toString()
        .padStart(2, '0')} (${dayNm.substring(
        now.getDay(),
        now.getDay() + 1,
    )}) ${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
}

function appendInfoArea(dataObj) {
    // pm25
    let pm25CSS = 'normal';
    let pmStatus = '좋음';

    if (dataObj.pm.pm25 <= 15) {
        pm25CSS = 'good';
        pmStatus = '좋음';
    } else if (dataObj.pm.pm25 <= 35) {
        pm25CSS = 'normal';
        pmStatus = '보통';
    } else if (dataObj.pm.pm25 <= 75) {
        pm25CSS = 'bad';
        pmStatus = '나쁨';
    } else if (dataObj.pm.pm25 > 75) {
        pm25CSS = 'worst';
        pmStatus = '매우나쁨';
    }

    // pm10
    let pm10CSS = 'normal';
    if (dataObj.pm.pm10 <= 30) {
        pm10CSS = 'good';
    } else if (dataObj.pm.pm10 <= 80) {
        pm10CSS = 'normal';
    } else if (dataObj.pm.pm10 <= 150) {
        pm10CSS = 'bad';
    } else if (dataObj.pm.pm10 > 150) {
        pm10CSS = 'worst';
    }

    let elemStr = '';
    elemStr += `<li class="contents-li col-xs-12 col-md-6 col-xl-4 col-xxl-3 col-xxxl-2">`;
    elemStr += `<div class="status-box box-12">`;
    elemStr += `    <div class="background">`;
    elemStr += `       <header class="status-header">`;
    elemStr += `           <h2 class="status-tit">`;
    elemStr +=
        `               <span class="status-place">` +
        dataObj.title +
        `</span>`;
    elemStr +=
        `               <span class="status-date"> 마지막 업데이트: ` +
        getDate(dataObj.time) +
        `</span>`;
    // elemStr += `               <span class="status-update">마지막 업데이트</span>`;
    elemStr += `           </h2>`;
    elemStr += `           <p>`;
    elemStr +=
        `                <i class="status-icon icon-` +
        pm25CSS +
        `">` +
        pmStatus +
        `</i>`;
    elemStr += `           </p>`;
    elemStr += `       </header>`;
    elemStr += `       <div class="status-detail-list middle">`;
    elemStr += `           <ul class="status-detail ultra-finedust">`;
    elemStr += `               <li>초미세먼지`;
    elemStr += `                   <span class="unit">(㎍/㎥)</span>`;
    elemStr += `                   <span class="accuracy">(${dataObj.accuracy}%)</span>`;
    elemStr += `               </li>`;
    elemStr +=
        `               <li><progress class="progress-bar ` +
        pm25CSS +
        `" value="` +
        dataObj.pm.pm25 +
        `" max="100"><strong></strong></progress></li>`;
    elemStr +=
        `               <li class="status-des"><span>` +
        dataObj.pm.pm25 +
        `</span></li>`;
    elemStr += `           </ul>`;
    elemStr += `           <ul class="status-detail finedust">`;
    elemStr += `               <li>미세먼지`;
    elemStr += `                   <span class="unit">(㎍/㎥)</span>`;
    elemStr += `               </li>`;
    elemStr +=
        `               <li><progress class="progress-bar ` +
        pm10CSS +
        `" value="` +
        dataObj.pm.pm10 +
        `" max="200"><strong></strong></progress></li>`;
    elemStr +=
        `               <li class="status-des"><span>` +
        dataObj.pm.pm10 +
        `</span></li>`;
    elemStr += `           </ul>`;

    // co2
    if (dataObj?.co2) {
        let co2CSS = 'normal';

        if (dataObj.co2.co2 <= 500) {
            co2CSS = 'good';
        } else if (dataObj.co2.co2 <= 1000) {
            co2CSS = 'normal';
        } else if (dataObj.co2.co2 <= 2000) {
            co2CSS = 'bad';
        } else if (dataObj.co2.co2 > 2000) {
            co2CSS = 'worst';
        }

        elemStr += `        <ul class="status-detail temp">`;
        elemStr += `           <li>이산화탄소`;
        elemStr += `               <span class="unit">(ppm)</span>`;
        elemStr += `           </li>`;
        elemStr +=
            `            <li><progress class="progress-bar ` +
            co2CSS +
            `" value="` +
            dataObj.co2.co2 +
            `" max="5000"><strong></strong></progress></li>`;
        elemStr +=
            `            <li class="status-des"><span class="value-humidity">` +
            dataObj.co2.co2 +
            `</span></li>`;
        elemStr += `        </ul>`;
    }

    // voc
    if (dataObj?.voc) {
        let vocCSS = 'normal';
        if (dataObj.voc.voc <= 50) {
            vocCSS = 'good';
        } else if (dataObj.voc.voc <= 100) {
            vocCSS = 'normal';
        } else if (dataObj.voc.voc <= 150) {
            vocCSS = 'bad';
        } else if (dataObj.voc.voc <= 200) {
            vocCSS = 'worst';
        }

        elemStr += `        <ul class="status-detail temp">`;
        elemStr += `           <li>VOC`;
        elemStr += `               <span class="unit">(ppm)</span>`;
        elemStr += `           </li>`;
        elemStr +=
            `            <li><progress class="progress-bar ` +
            vocCSS +
            `" value="` +
            dataObj.voc.voc +
            `" max="200"><strong></strong></progress></li>`;
        elemStr +=
            `            <li class="status-des"><span class="value-humidity">` +
            dataObj.voc.voc +
            `</span></li>`;
        elemStr += `        </ul>`;
    }

    elemStr += `       </div>`;
    // 온습도
    elemStr += `       <div class="status-detail-list">`;
    elemStr += `           <ul class="status-detail temp">`;
    elemStr += `               <li>온도`;
    elemStr += `                   <span class="unit">(℃)</span>`;
    elemStr += `               </li>`;
    elemStr += `               <li><progress class="progress-bar" value="0" max="100"><strong></strong></progress></li>`;
    elemStr +=
        `               <li class="status-des"><span class="value-temp">` +
        dataObj.humid.celsius +
        `</span></li>`;
    elemStr += `           </ul>`;
    elemStr += `           <ul class="status-detail temp">`;
    elemStr += `               <li>습도`;
    elemStr += `                   <span class="unit">(%)</span>`;
    elemStr += `               </li>`;
    elemStr += `               <li><progress class="progress-bar" value="0" max="100"><strong></strong></progress></li>`;
    elemStr +=
        `               <li class="status-des"><span class="value-humidity">` +
        dataObj.humid.humidity +
        `</span></li>`;
    elemStr += `           </ul>`;

    elemStr += `        </div>`;
    elemStr += `    </div>`;
    elemStr += `</div>`;
    elemStr += `</li>`;

    const pUl = document.getElementById('devices').querySelector('ul');
    pUl.insertAdjacentHTML('beforeend', elemStr);
}

(() => {
    callApi();
    setInterval(callApi, 1000 * 60 * 1); //1분 단위 리로드
})();

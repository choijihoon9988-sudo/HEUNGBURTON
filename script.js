document.addEventListener('DOMContentLoaded', () => {

    // ------------------------------------
    // --- 1. 상태 관리 (State Management) ---
    // ------------------------------------

    // 애플리케이션의 모든 데이터를 담는 단일 소스(Single Source of Truth)
    let appState = {
        contentLibrary: [], // [오류 수정] 빈 배열로 초기화
        analysisNotes: [], // [오류 수정] 빈 배열로 초기화
        challenges: [
            { id: 1, level: 1, description: "흥버튼 영상 1분 '쉐도잉' 녹음", xp: 100, completed: false },
            { id: 2, level: 5, description: "'쪼개기 노트' 10개 작성하기", xp: 150, completed: false },
            { id: 3, level: 10, description: "분석한 '기법' 1개 활용하여 1분 영상 녹화", xp: 200, completed: false },
            { id: 4, level: 20, description: "주제 스피치(3분) 녹화 (흥버튼 스타일 적용)", xp: 300, completed: false },
        ],
        playerStats: {
            xp: 0,
            level: 1,
            skillTree: {
                logic: 0,
                appeal: 0,
                skill: 0,
            },
        },
    };

    // 레벨업에 필요한 XP 테이블
    const XP_PER_LEVEL = 1000;

    // localStorage에서 상태 불러오기
    function loadState() {
        const savedState = localStorage.getItem('speechLabState');
        if (savedState) {
            appState = JSON.parse(savedState);
        }
    }

    // localStorage에 상태 저장하기
    function saveState() {
        localStorage.setItem('speechLabState', JSON.stringify(appState));
    }

    // ------------------------------------
    // --- 2. DOM 요소 캐싱 ---
    // ------------------------------------
    const tabs = document.querySelectorAll('.nav-tab');
    const modules = document.querySelectorAll('.module');

    // 모듈 1: 라이브러리
    const addContentForm = document.getElementById('add-content-form');
    const contentList = document.getElementById('content-list');

    // 모듈 2: 분석기
    const deconNoteForm = document.getElementById('decon-note-form');
    const linkedContentSelect = document.getElementById('linked-content');
    const analysisNoteList = document.getElementById('analysis-note-list');

    // 모듈 3: 챌린지
    const challengeList = document.getElementById('challenge-list');

    // 모듈 4: 대시보드
    const levelDisplay = document.getElementById('level-display');
    const xpDisplay = document.getElementById('xp-display');
    const xpBar = document.getElementById('xp-bar');
    const xpTextDisplay = document.getElementById('xp-text-display');
    const skillTreeChartCanvas = document.getElementById('skillTreeChart').getContext('2d');
    let skillTreeChart;


    // ------------------------------------
    // --- 3. 핵심 로직 (Controllers) ---
    // ------------------------------------

    // XP 추가 및 레벨업 체크
    function addXp(amount) {
        appState.playerStats.xp += amount;
        checkForLevelUp();
    }

    // 레벨업 로직
    function checkForLevelUp() {
        const currentLevel = appState.playerStats.level;
        const currentXp = appState.playerStats.xp;
        const xpForNextLevel = currentLevel * XP_PER_LEVEL;
        
        if (currentXp >= xpForNextLevel) {
            appState.playerStats.level++;
            // 레벨업 시 알림 등 추가 가능
            alert(`🎉 레벨 업! 축하합니다! Level ${appState.playerStats.level} 달성!`);
        }
    }

    // 모듈 1: 콘텐츠 추가
    function handleAddContent(e) {
        e.preventDefault();
        const title = document.getElementById('content-title').value;
        const url = document.getElementById('content-url').value;
        const type = document.getElementById('content-type').value;
        const category = document.getElementById('content-category').value;

        const newContent = {
            id: Date.now(),
            title, url, type, category
        };

        appState.contentLibrary.push(newContent);
        addXp(10); // 콘텐츠 추가 시 +10 XP
        
        saveState();
        render();
        addContentForm.reset();
    }

    // 모듈 2: 쪼개기 노트 제출
    function handleSubmitNote(e) {
        e.preventDefault();
        
        const selectedTags = Array.from(document.querySelectorAll('input[name="skill-tag"]:checked')).map(el => el.value);
        
        const newNote = {
            id: Date.now(),
            contentId: document.getElementById('linked-content').value,
            script: document.getElementById('original-script').value,
            intent: document.getElementById('analysis-intent').value,
            technique: document.getElementById('analysis-technique').value,
            emotion: document.getElementById('analysis-emotion').value,
            keywords: document.getElementById('analysis-keywords').value,
            rewriting: document.getElementById('my-rewriting').value,
            tags: selectedTags
        };

        appState.analysisNotes.push(newNote);
        addXp(50); // 노트 제출 시 +50 XP

        // Skill Tree 업데이트
        newNote.tags.forEach(tag => {
            if (appState.playerStats.skillTree.hasOwnProperty(tag)) {
                appState.playerStats.skillTree[tag]++;
            }
        });

        saveState();
        render();
        deconNoteForm.reset();
    }

    // 모듈 3: 챌린지 완료
    function handleCompleteChallenge(challengeId) {
        const challenge = appState.challenges.find(c => c.id === challengeId);
        if (challenge && !challenge.completed) {
            challenge.completed = true;
            addXp(challenge.xp); // 챌린지 완료 시 정해진 XP 획득

            saveState();
            render();
        }
    }


    // ------------------------------------
    // --- 4. 렌더링 (Views) ---
    // ------------------------------------

    // 마스터 렌더링 함수: 모든 UI 업데이트를 총괄
    function render() {
        renderDashboard();
        renderLibrary();
        renderAnalyzer();
        renderChallenges();
    }

    // 대시보드 렌더링
    function renderDashboard() {
        const stats = appState.playerStats;
        const xpForCurrentLevel = (stats.level - 1) * XP_PER_LEVEL;
        const xpForNextLevel = stats.level * XP_PER_LEVEL;
        const xpProgress = stats.xp - xpForCurrentLevel;
        const xpNeeded = xpForNextLevel - xpForCurrentLevel;
        const progressPercentage = Math.min(100, (xpProgress / xpNeeded) * 100);

        levelDisplay.textContent = stats.level;
        xpDisplay.textContent = stats.xp.toLocaleString();
        xpBar.style.width = `${progressPercentage}%`;
        xpBar.textContent = `${Math.round(progressPercentage)}%`;
        xpTextDisplay.textContent = `${stats.xp.toLocaleString()} / ${xpForNextLevel.toLocaleString()}`;

        // 스킬 트리 차트 업데이트
        // [오류 수정] datasets[0].data로 정확히 할당
        if (skillTreeChart) {
             skillTreeChart.data.datasets[0].data = [stats.skillTree.logic, stats.skillTree.appeal, stats.skillTree.skill];
             skillTreeChart.update();
        }
    }

    // 라이브러리 렌더링
    function renderLibrary() {
        contentList.innerHTML = '';
        if (appState.contentLibrary.length === 0) {
            contentList.innerHTML = '<p>아직 추가된 콘텐츠가 없습니다.</p>';
            return;
        }
        appState.contentLibrary.forEach(content => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.innerHTML = `
                <div>
                    <strong>${content.title}</strong>
                    <small style="color: var(--text-secondary-color); display: block;">${content.category} / ${content.type}</small>
                </div>
                <a href="${content.url}" target="_blank" class="btn btn-secondary">영상 보기</a>
            `;
            contentList.appendChild(li);
        });
    }
    
    // 분석기 렌더링 (콘텐츠 선택 옵션 및 최근 노트)
    function renderAnalyzer() {
        // 콘텐츠 선택 드롭다운 채우기
        linkedContentSelect.innerHTML = '<option value="">-- 콘텐츠 선택 --</option>'; // 기본 옵션 추가
        appState.contentLibrary.forEach(content => {
            const option = document.createElement('option');
            option.value = content.id;
            option.textContent = content.title;
            linkedContentSelect.appendChild(option);
        });

        // 최근 분석 노트 5개 표시
        analysisNoteList.innerHTML = '';
        // [오류 수정] .reverse() 구문 오류 수정 및 원본 배열 수정을 막기 위해 .slice() 추가
        const recentNotes = appState.analysisNotes.slice().reverse().slice(0, 5); 
        
        if (recentNotes.length === 0) {
            analysisNoteList.innerHTML = '<p>아직 작성된 분석 노트가 없습니다.</p>';
            return;
        }
        recentNotes.forEach(note => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            const linkedContent = appState.contentLibrary.find(c => c.id == note.contentId);
            li.innerHTML = `
                <div>
                    <strong>"${note.script.substring(0, 30)}..."</strong>
                    <small style="color: var(--text-secondary-color); display: block;">
                        분석 영상: ${linkedContent ? linkedContent.title : '알 수 없음'}
                    </small>
                </div>
                <div>${note.tags.map(t => `<span class="badge">${t}</span>`).join(' ')}</div>
            `;
            analysisNoteList.appendChild(li);
        });
    }


    // 챌린지 렌더링
    function renderChallenges() {
        challengeList.innerHTML = '';
        appState.challenges.forEach(challenge => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            
            // [오류 수정] li와 button에 각각 올바른 클래스가 적용되도록 수정
            if (challenge.completed) {
                li.classList.add('challenge-item-completed');
            }
            
            li.innerHTML = `
                <div>
                    <strong>Lv.${challenge.level}: ${challenge.description}</strong>
                    <small style="color: var(--text-secondary-color); display: block;">보상: ${challenge.xp} XP</small>
                </div>
                <button class="btn ${challenge.completed ? 'challenge-item-completed' : 'btn-secondary'}" data-challenge-id="${challenge.id}" ${challenge.completed ? 'disabled' : ''}>
                    ${challenge.completed ? '완료됨' : '완료'}
                </button>
            `;
            challengeList.appendChild(li);
        });
    }

    // ------------------------------------
    // --- 5. 초기화 및 이벤트 리스너 ---
    // ------------------------------------

    // 스킬 트리 차트 초기화
    function initChart() {
        skillTreeChart = new Chart(skillTreeChartCanvas, {
            type: 'bar',
            data: {
                labels: ['논리', '호감', '스킬'],
                datasets: [{
                    label: '분석 횟수',
                    // [오류 수정] 초기 데이터가 appState에서 로드되도록 수정
                    data: [
                        appState.playerStats.skillTree.logic,
                        appState.playerStats.skillTree.appeal,
                        appState.playerStats.skillTree.skill
                    ], 
                    backgroundColor: [
                        'rgba(3, 218, 198, 0.6)',
                        'rgba(187, 134, 252, 0.6)',
                        'rgba(55, 0, 179, 0.6)'
                    ],
                    borderColor: [
                        'rgba(3, 218, 198, 1)',
                        'rgba(187, 134, 252, 1)',
                        'rgba(55, 0, 179, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        // [오류 수정] JS는 CSS var()를 읽지 못하므로 실제 색상 값으로 대체
                        ticks: { color: '#a0a0a0' }, 
                        grid: { color: '#333333' }
                    },
                    y: {
                        // [오류 수정] 실제 색상 값으로 대체
                        ticks: { color: '#e0e0e0', font: { size: 14 } }, 
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                maintainAspectRatio: false
            }
        });
    }

    // 애플리케이션 초기화 함수
    function init() {
        loadState();
        initChart();

        // 탭 전환 로직
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                modules.forEach(m => m.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`${tab.dataset.tab}-module`).classList.add('active');
            });
        });

        // 폼 제출 이벤트 리스너
        addContentForm.addEventListener('submit', handleAddContent);
        deconNoteForm.addEventListener('submit', handleSubmitNote);

        // 챌린지 완료 버튼 이벤트 리스너 (이벤트 위임)
        challengeList.addEventListener('click', (e) => {
            if (e.target.matches('button[data-challenge-id]')) {
                const challengeId = parseInt(e.target.dataset.challengeId);
                handleCompleteChallenge(challengeId);
            }
        });

        // 초기 렌더링 실행
        render();
    }

    // 초기화 함수 호출
    init();
}); 
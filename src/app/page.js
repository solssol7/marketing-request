'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function Home() {
    // --- 초기 데이터 상태 ---
    const [users, setUsers] = useState([]);
    const [marts, setMarts] = useState([]);
    const [minDate, setMinDate] = useState('');
    const [loading, setLoading] = useState(false);
    
    // --- 디버그 상태 ---
    const [showDebug, setShowDebug] = useState(false);
    const [debugInfo, setDebugInfo] = useState({ logs: [], error: null, status: '대기 중' });

    // --- 입력 폼 상태 ---
    const [requester, setRequester] = useState('');
    const [selectedMartName, setSelectedMartName] = useState('');
    const [currentDueDate, setCurrentDueDate] = useState('');
    const [activeTab, setActiveTab] = useState('tab1');

    const initialRequestState = {
        실내용X배너개수: 0, 실외용X배너개수: 0, x배너디자인: [],
        현수막가로: '', 현수막세로: '', 현수막디자인: '',
        전단지가로: '', 전단지세로: '', 전단지디자인: '',
        기타: '', 디자인사이즈: '', 디자인용도: ''
    };
    const [currentRequest, setCurrentRequest] = useState(initialRequestState);
    
    // --- 장바구니 상태 ---
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // 데이터 로드 함수 (디버깅 정보 포함)
    const loadData = async () => {
        setDebugInfo(prev => ({ ...prev, status: '데이터 로딩 중...' }));
        try {
            const res = await fetch('/api/init');
            const data = await res.json();

            // 디버그 로그 저장
            if (data.debugLogs) {
                setDebugInfo(prev => ({ ...prev, logs: data.debugLogs }));
            }

            if (data.success) {
                setUsers(data.users || []);
                setMarts(data.marts || []);
                setDebugInfo(prev => ({ 
                    ...prev, 
                    error: null, 
                    status: `성공: 유저 ${data.users?.length}명, 마트 ${data.marts?.length}개 로드됨` 
                }));
            } else {
                throw new Error(data.error || '알 수 없는 서버 에러');
            }
        } catch (err) {
            console.error(err);
            setDebugInfo(prev => ({ 
                ...prev, 
                error: err.message, 
                status: '로드 실패' 
            }));
        }
    };

    useEffect(() => {
        setMinDate(new Date().toISOString().split('T')[0]);
        loadData();
    }, []);

    // 장바구니 담기
    const addToCart = () => {
        if (!requester) return alert('요청자 이름을 선택해주세요.');
        if (!selectedMartName) return alert('마트를 선택해주세요.');
        if (!currentDueDate) return alert('이 마트의 마감기한을 선택해주세요.');

        // 마트 ID 찾기 (이름으로 매칭)
        const martInfo = marts.find(m => m.name === selectedMartName) || { id: 'Unknown' };
        
        // 요약 생성
        const getRequestSummary = (data) => {
             const parts = [];
             if (data.실내용X배너개수 > 0 || data.실외용X배너개수 > 0) parts.push(`X배너(${Number(data.실내용X배너개수)+Number(data.실외용X배너개수)})`);
             if (data.현수막가로) parts.push('현수막');
             if (data.전단지가로) parts.push('전단지');
             if (data.디자인용도) parts.push('디자인');
             if (data.기타) parts.push('기타');
             return parts.length > 0 ? parts.join(', ') : '내용 없음';
        };

        const summary = getRequestSummary(currentRequest);
        
        // 내용이 없으면 확인
        if (summary === '내용 없음') {
            if (!confirm('입력된 품목이 없습니다. 그래도 담으시겠습니까?')) return;
        }

        const newItem = {
            id: Date.now(),
            martName: selectedMartName,
            martId: martInfo.id,
            dueDate: currentDueDate,
            details: { ...currentRequest },
            summary: summary
        };

        setCart([...cart, newItem]);
        
        // 입력 필드 초기화 (요청자는 유지)
        setSelectedMartName('');
        setCurrentDueDate('');
        setCurrentRequest(initialRequestState);
        setActiveTab('tab1');
        
        alert(`${selectedMartName} 요청이 장바구니에 담겼습니다.`);
        setIsCartOpen(true); // 모바일에서 장바구니 열기
    };

    const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

    // 최종 제출 (일괄 전송)
    const handleSubmitAll = async () => {
        if (cart.length === 0) return alert('장바구니가 비어있습니다.');
        if (!confirm(`총 ${cart.length}건의 요청을 제출하시겠습니까?`)) return;

        setLoading(true);
        try {
            for (const item of cart) {
                const payload = {
                    요청자: requester,
                    마트명: item.martName,
                    마트Id: item.martId,
                    마감기한: item.dueDate,
                    ...item.details
                };
                
                const res = await fetch('/api/submit', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(`${item.martName} 전송 실패: ${errData.error}`);
                }
            }
            alert('모든 요청이 성공적으로 완료되었습니다!');
            window.location.reload();
        } catch (err) {
            alert('오류 발생: ' + err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // 탭 메뉴
    const tabs = [
        { id: 'tab1', label: 'X배너' },
        { id: 'tab2', label: '현수막' },
        { id: 'tab3', label: '전단지' },
        { id: 'tab4', label: '기타' },
        { id: 'tab5', label: '디자인' },
        { id: 'tab6', label: '자료실' },
    ];

    return (
        <div className={styles.container}>
            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <h1 className={styles.pageTitle}>마케팅 요청</h1>
                    <p className={styles.pageDesc}>마트별 필요한 품목을 담아 한 번에 요청하세요.</p>
                </header>

                {/* 에러 발생 시 알림 배너 */}
                {debugInfo.error && (
                    <div className={styles.errorBanner}>
                        🚨 데이터 로드 실패: {debugInfo.error}
                        <br/>
                        <button onClick={loadData} className={styles.retryBtn}>다시 시도</button>
                    </div>
                )}

                {/* 1단계: 기본 정보 선택 */}
                <section className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>1. 기본 정보 선택</h2>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            요청자 (이름)
                            <input list="users-list" value={requester} onChange={(e) => setRequester(e.target.value)} placeholder="이름 입력/선택" className={styles.input}/>
                            <datalist id="users-list">
                                {users.map((u, i) => <option key={i} value={u} />)}
                            </datalist>
                        </label>
                        
                        <div className={styles.row}>
                            <label className={styles.label}>
                                마트 선택
                                <input list="marts-list" value={selectedMartName} onChange={(e) => setSelectedMartName(e.target.value)} placeholder="마트 검색" className={styles.input}/>
                                <datalist id="marts-list">
                                    {marts.map((m, i) => <option key={i} value={m.name} />)}
                                </datalist>
                            </label>
                            <label className={styles.label}>
                                희망 마감일
                                <input type="date" min={minDate} value={currentDueDate} onChange={(e) => setCurrentDueDate(e.target.value)} className={styles.input}/>
                            </label>
                        </div>
                    </div>
                </section>

                {/* 2단계: 품목 입력 */}
                <section className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>2. 요청 품목 입력</h2>
                    <div className={styles.tabsContainer}>
                        {tabs.map(tab => (
                            <button key={tab.id} className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTab : ''}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
                        ))}
                    </div>

                    <div className={styles.tabContent}>
                        {activeTab === 'tab1' && (
                            <div className={styles.fieldGrid}>
                                <label>실내용 수량 <input type="number" className={styles.input} value={currentRequest.실내용X배너개수} onChange={e=>setCurrentRequest({...currentRequest, 실내용X배너개수:e.target.value})} /></label>
                                <label>실외용 수량 <input type="number" className={styles.input} value={currentRequest.실외용X배너개수} onChange={e=>setCurrentRequest({...currentRequest, 실외용X배너개수:e.target.value})} /></label>
                                <p className={styles.helperText}>* 디자인 번호는 기존 PDF나 공지사항을 참고해주세요.</p>
                            </div>
                        )}
                        {activeTab === 'tab2' && (
                            <div className={styles.fieldGrid}>
                                <label>가로 (cm) <input type="number" className={styles.input} value={currentRequest.현수막가로} onChange={e=>setCurrentRequest({...currentRequest, 현수막가로:e.target.value})} /></label>
                                <label>세로 (cm) <input type="number" className={styles.input} value={currentRequest.현수막세로} onChange={e=>setCurrentRequest({...currentRequest, 현수막세로:e.target.value})} /></label>
                            </div>
                        )}
                        {activeTab === 'tab3' && (
                            <div className={styles.fieldGrid}>
                                <label>전단지 가로 <input type="text" className={styles.input} value={currentRequest.전단지가로} onChange={e=>setCurrentRequest({...currentRequest, 전단지가로:e.target.value})} /></label>
                                <label>전단지 세로 <input type="text" className={styles.input} value={currentRequest.전단지세로} onChange={e=>setCurrentRequest({...currentRequest, 전단지세로:e.target.value})} /></label>
                            </div>
                        )}
                        {activeTab === 'tab4' && (
                            <textarea className={styles.textarea} placeholder="요청 내용을 자세히 적어주세요." value={currentRequest.기타} onChange={e=>setCurrentRequest({...currentRequest, 기타:e.target.value})}></textarea>
                        )}
                        {activeTab === 'tab5' && (
                            <div className={styles.fieldGrid}>
                                <label>용도 <input type="text" className={styles.input} value={currentRequest.디자인용도} onChange={e=>setCurrentRequest({...currentRequest, 디자인용도:e.target.value})} /></label>
                                <label>사이즈 <input type="text" className={styles.input} value={currentRequest.디자인사이즈} onChange={e=>setCurrentRequest({...currentRequest, 디자인사이즈:e.target.value})} /></label>
                            </div>
                        )}
                        {activeTab === 'tab6' && (
                            <div style={{textAlign: 'center', padding: '20px'}}>
                                <p>필요한 자료나 시안을 확인하세요.</p>
                                <a href="https://drive.google.com/" target="_blank" className={styles.linkBtn}>📂 구글 드라이브 바로가기</a>
                            </div>
                        )}
                    </div>
                    <button className={styles.addToCartBtn} onClick={addToCart}>🛒 장바구니에 담기</button>
                </section>

                {/* 디버그 패널 토글 */}
                <div className={styles.debugSection}>
                    <button onClick={() => setShowDebug(!showDebug)} className={styles.debugToggle}>
                        🛠 디버그 모드 {showDebug ? '끄기' : '켜기'}
                    </button>
                    {showDebug && (
                        <div className={styles.debugPanel}>
                            <p><strong>Status:</strong> {debugInfo.status}</p>
                            <p><strong>Error:</strong> {debugInfo.error || 'None'}</p>
                            <details>
                                <summary>Server Logs (클릭하여 확인)</summary>
                                <pre>{debugInfo.logs.join('\n')}</pre>
                            </details>
                            <details>
                                <summary>Loaded Data (클릭하여 확인)</summary>
                                <p>Users ({users.length}): {JSON.stringify(users.slice(0, 3))} ...</p>
                                <p>Marts ({marts.length}): {JSON.stringify(marts.slice(0, 3))} ...</p>
                            </details>
                        </div>
                    )}
                </div>
            </main>

            {/* 장바구니 사이드바 */}
            <aside className={`${styles.cartSidebar} ${isCartOpen ? styles.open : ''}`}>
                 <div className={styles.cartHeader} onClick={() => setIsCartOpen(!isCartOpen)}>
                    <h3>장바구니 <span className={styles.badge}>{cart.length}</span></h3>
                    <span className={styles.toggleIcon}>{isCartOpen ? '▼' : '▲'}</span>
                </div>
                <div className={styles.cartContent}>
                    {cart.length === 0 ? (
                        <p className={styles.emptyMsg}>담긴 요청이 없습니다.</p>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className={styles.cartItem}>
                                <div className={styles.cartItemHeader}>
                                    <span>{item.martName}</span>
                                    <span className={styles.dueDate}>~{item.dueDate}</span>
                                </div>
                                <div className={styles.cartItemBody}>{item.summary}</div>
                                <button className={styles.removeBtn} onClick={() => removeFromCart(item.id)}>삭제</button>
                            </div>
                        ))
                    )}
                    
                    {cart.length > 0 && (
                         <div className={styles.cartFooter}>
                            <p className={styles.requesterInfo}>요청자: <strong>{requester || '미지정'}</strong></p>
                            <button className={styles.submitBtn} onClick={handleSubmitAll} disabled={loading}>
                                {loading ? '전송 중...' : '모두 제출하기'}
                            </button>
                        </div>
                    )}
                </div>
            </aside>
             {isCartOpen && <div className={styles.backdrop} onClick={() => setIsCartOpen(false)}></div>}
        </div>
    );
}

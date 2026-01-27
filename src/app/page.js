'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function Home() {
    // --- 초기 데이터 상태 ---
    const [users, setUsers] = useState([]);
    const [marts, setMarts] = useState([]);
    const [minDate, setMinDate] = useState('');
    const [loading, setLoading] = useState(false);

    // --- 입력 폼 상태 ---
    const [requester, setRequester] = useState(''); // 요청자 (전역 고정)
    const [selectedMartName, setSelectedMartName] = useState(''); // 현재 선택한 마트
    const [currentDueDate, setCurrentDueDate] = useState(''); // 현재 마트의 마감일
    const [activeTab, setActiveTab] = useState('tab1'); // 탭 상태

    // 현재 작성 중인 요청 내용
    const initialRequestState = {
        실내용X배너개수: 0, 실외용X배너개수: 0, x배너디자인: [],
        현수막가로: '', 현수막세로: '', 현수막디자인: '',
        전단지가로: '', 전단지세로: '', 전단지디자인: '',
        기타: '', 디자인사이즈: '', 디자인용도: ''
    };
    const [currentRequest, setCurrentRequest] = useState(initialRequestState);

    // --- 장바구니 상태 ---
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false); // 모바일용 장바구니 토글

    // 초기 로딩
    useEffect(() => {
        setMinDate(new Date().toISOString().split('T')[0]);
        // API 호출 (가상)
        fetch('/api/init')
            .then(res => res.json())
            .then(data => {
                setUsers(data.users || []);
                setMarts(data.marts || []);
            })
            .catch(err => console.error(err));
    }, []);

    // --- 핸들러 함수들 ---

    // 1. 장바구니 담기
    const addToCart = () => {
        if (!requester) return alert('요청자 이름을 선택해주세요.');
        if (!selectedMartName) return alert('마트를 선택해주세요.');
        if (!currentDueDate) return alert('이 마트의 마감기한을 선택해주세요.');

        // 마트 ID 찾기
        const martInfo = marts.find(m => m.name === selectedMartName) || { id: 'Unknown' };

        // 요청 내용이 비었는지 확인 (선택 사항)
        const summary = getRequestSummary(currentRequest);
        if (summary === '내용 없음') {
            if (!confirm('입력된 품목이 없습니다. 그래도 담으시겠습니까?')) return;
        }

        const newItem = {
            id: Date.now(), // 고유 ID
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
        
        // 사용자 피드백
        alert(`${selectedMartName} 요청이 장바구니에 담겼습니다.\n다른 마트를 추가하거나 제출할 수 있습니다.`);
        setIsCartOpen(true); // 장바구니 열어서 보여주기
    };

    // 2. 장바구니 항목 삭제
    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    // 3. 최종 제출
    const handleSubmitAll = async () => {
        if (cart.length === 0) return alert('장바구니가 비어있습니다.');
        if (!confirm(`총 ${cart.length}건의 마트 요청을 제출하시겠습니까?`)) return;

        setLoading(true);
        try {
            // 순차적으로 전송 (안정성 위해)
            for (const item of cart) {
                const payload = {
                    요청자: requester,
                    마트명: item.martName,
                    마트Id: item.martId,
                    마감기한: item.dueDate, // 각 마트별 마감일 사용
                    ...item.details
                };
                await fetch('/api/submit', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }
            alert('모든 요청이 성공적으로 접수되었습니다!');
            window.location.reload();
        } catch (err) {
            alert('전송 중 오류가 발생했습니다: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // 요약 텍스트 생성기
    const getRequestSummary = (data) => {
        const parts = [];
        if (data.실내용X배너개수 > 0 || data.실외용X배너개수 > 0) parts.push(`X배너(${Number(data.실내용X배너개수)+Number(data.실외용X배너개수)})`);
        if (data.현수막가로) parts.push('현수막');
        if (data.전단지가로) parts.push('전단지');
        if (data.디자인용도) parts.push('디자인');
        if (data.기타) parts.push('기타');
        return parts.length > 0 ? parts.join(', ') : '내용 없음';
    };

    // 탭 메뉴 정의
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
            {/* 좌측 메인 입력 영역 */}
            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <h1 className={styles.pageTitle}>마케팅 요청</h1>
                    <p className={styles.pageDesc}>마트별 필요한 품목을 담아 한 번에 요청하세요.</p>
                </header>

                {/* 1단계: 기본 정보 선택 */}
                <section className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>1. 기본 정보 선택</h2>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            요청자 (이름)
                            <input 
                                list="users-list" 
                                value={requester} 
                                onChange={(e) => setRequester(e.target.value)} 
                                placeholder="이름을 입력/선택하세요"
                                className={styles.input}
                            />
                            <datalist id="users-list">
                                {users.map((u, i) => <option key={i} value={u} />)}
                            </datalist>
                        </label>
                        
                        <div className={styles.row}>
                            <label className={styles.label}>
                                마트 선택
                                <input 
                                    list="marts-list" 
                                    value={selectedMartName} 
                                    onChange={(e) => setSelectedMartName(e.target.value)} 
                                    placeholder="마트명 검색"
                                    className={styles.input}
                                />
                                <datalist id="marts-list">
                                    {marts.map((m, i) => <option key={i} value={m.name} />)}
                                </datalist>
                            </label>
                            <label className={styles.label}>
                                희망 마감일
                                <input 
                                    type="date" 
                                    min={minDate} 
                                    value={currentDueDate} 
                                    onChange={(e) => setCurrentDueDate(e.target.value)} 
                                    className={styles.input}
                                />
                            </label>
                        </div>
                    </div>
                </section>

                {/* 2단계: 품목 입력 (탭) */}
                <section className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>2. 요청 품목 입력</h2>
                    
                    <div className={styles.tabsContainer}>
                        {tabs.map(tab => (
                            <button 
                                key={tab.id}
                                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className={styles.tabContent}>
                        {activeTab === 'tab1' && (
                            <div className={styles.fieldGrid}>
                                <label>실내용 수량 <input type="number" className={styles.input} value={currentRequest.실내용X배너개수} onChange={e=>setCurrentRequest({...currentRequest, 실내용X배너개수:e.target.value})} /></label>
                                <label>실외용 수량 <input type="number" className={styles.input} value={currentRequest.실외용X배너개수} onChange={e=>setCurrentRequest({...currentRequest, 실외용X배너개수:e.target.value})} /></label>
                                {/* 디자인 선택 로직은 간소화하여 생략, 필요시 추가 */}
                                <div className={styles.helperText}>* 디자인 타입은 아래 이미지 참조</div>
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
                            <textarea 
                                className={styles.textarea} 
                                placeholder="기타 요청사항을 자세히 적어주세요."
                                value={currentRequest.기타}
                                onChange={e=>setCurrentRequest({...currentRequest, 기타:e.target.value})}
                            ></textarea>
                        )}
                        {/* 나머지 탭 생략 */}
                    </div>

                    <button className={styles.addToCartBtn} onClick={addToCart}>
                        🛒 장바구니에 담기
                    </button>
                </section>
            </main>

            {/* 우측 사이드바 (모바일에서는 하단/토글) */}
            <aside className={`${styles.cartSidebar} ${isCartOpen ? styles.open : ''}`}>
                <div className={styles.cartHeader} onClick={() => setIsCartOpen(!isCartOpen)}>
                    <h3>장바구니 <span className={styles.badge}>{cart.length}</span></h3>
                    <span className={styles.toggleIcon}>{isCartOpen ? '▼' : '▲'}</span>
                </div>

                <div className={styles.cartContent}>
                    {cart.length === 0 ? (
                        <p className={styles.emptyMsg}>담긴 요청이 없습니다.</p>
                    ) : (
                        <ul className={styles.cartList}>
                            {cart.map((item) => (
                                <li key={item.id} className={styles.cartItem}>
                                    <div className={styles.cartItemHeader}>
                                        <span className={styles.martName}>{item.martName}</span>
                                        <span className={styles.dueDate}>~{item.dueDate}</span>
                                    </div>
                                    <div className={styles.cartItemBody}>
                                        {item.summary}
                                    </div>
                                    <button className={styles.removeBtn} onClick={() => removeFromCart(item.id)}>삭제</button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className={styles.cartFooter}>
                        <p className={styles.requesterInfo}>요청자: <strong>{requester || '미지정'}</strong></p>
                        <button 
                            className={styles.submitBtn} 
                            onClick={handleSubmitAll}
                            disabled={loading || cart.length === 0}
                        >
                            {loading ? '처리 중...' : '모두 제출하기'}
                        </button>
                    </div>
                </div>
            </aside>
            
            {/* 모바일에서 장바구니 닫혀있을 때 배경 클릭시 닫기 (선택사항) */}
            {isCartOpen && <div className={styles.backdrop} onClick={() => setIsCartOpen(false)}></div>}
        </div>
    );
}

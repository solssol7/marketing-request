'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function Home() {
    // --- 데이터 상태 ---
    const [users, setUsers] = useState([]);
    const [marts, setMarts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [minDate, setMinDate] = useState('');

    // --- UI 상태 ---
    const [step, setStep] = useState(1);
    const [activeTab, setActiveTab] = useState('tab1');
    const [showDesignModal, setShowDesignModal] = useState(false);
    const [designModalType, setDesignModalType] = useState(''); // 'xbanner' or 'banner'

    // --- 입력 상태 ---
    const [requester, setRequester] = useState('');
    const [martSearch, setMartSearch] = useState('');
    const [selectedMart, setSelectedMart] = useState(null);
    const [dueDate, setDueDate] = useState('');
    
    // 요청 품목 상태
    const initialRequest = {
        실내용X배너개수: 0, 실외용X배너개수: 0, x배너디자인: [],
        현수막가로: '', 현수막세로: '', 현수막디자인: '',
        전단지가로: '', 전단지세로: '', 전단지디자인: '',
        기타: '', 디자인사이즈: '', 디자인용도: ''
    };
    const [currentRequest, setCurrentRequest] = useState(initialRequest);

    // 초기 데이터 로드 (API 연결 및 에러 방지)
    useEffect(() => {
        setMinDate(new Date().toISOString().split('T')[0]);
        
        async function fetchData() {
            try {
                const res = await fetch('/api/init');
                
                // HTML 에러 페이지가 오는지 확인 (Vercel 에러 방지)
                const contentType = res.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new Error("서버 응답 오류 (JSON 아님)");
                }

                const data = await res.json();
                if (data.success) {
                    setUsers(data.users || []);
                    setMarts(data.marts || []);
                } else {
                    console.error(data.error);
                }
            } catch (err) {
                console.error('데이터 로드 실패:', err);
            }
        }
        fetchData();
    }, []);

    // 마트 검색 필터
    const filteredMarts = marts.filter(m => 
        m.name.toLowerCase().includes(martSearch.toLowerCase())
    );

    // [New] 마트 선택 핸들러 (주문 불가 시 확인창)
    const handleMartSelect = (mart) => {
        if (!mart.orderable) {
            const isConfirmed = confirm('현재 선택하신 마트는 [주문 불가] 상태입니다.\n그래도 계속 신청하시겠습니까?');
            if (!isConfirmed) return; 
        }
        setSelectedMart(mart);
    };

    // 숫자 입력 핸들러 (음수 방지)
    const handleNumberChange = (e, field) => {
        let val = e.target.value;
        if (val !== '' && Number(val) < 0) {
            val = 0;
        }
        setCurrentRequest(prev => ({ ...prev, [field]: val }));
    };

    // X배너 체크박스 핸들러
    const handleXBannerCheck = (val) => {
        let newDesign = [...currentRequest.x배너디자인];
        if (val === 'none') {
            newDesign = newDesign.includes('none') ? [] : ['none'];
        } else {
            if (newDesign.includes('none')) newDesign = [];
            if (newDesign.includes(val)) {
                newDesign = newDesign.filter(item => item !== val);
            } else {
                newDesign.push(val);
            }
        }
        setCurrentRequest(prev => ({ ...prev, x배너디자인: newDesign }));
    };

    // 상단 탭 클릭 핸들러 (네비게이션)
    const handleStepClick = (targetStep) => {
        if (targetStep < step) {
            setStep(targetStep);
        } else if (targetStep > step) {
            if (step === 1 && targetStep === 2) {
                if (!requester || !selectedMart) {
                    return alert('요청자와 마트를 먼저 선택해주세요.');
                }
                setStep(2);
            }
        }
    };

    // 다음 단계로 이동 (유효성 검사 포함)
    const goNext = () => {
        if (step === 1) {
            if (!requester) return alert('요청자를 선택해주세요.');
            if (!selectedMart) return alert('마트를 선택해주세요.');
        }
        
        if (step === 2) {
            // 1. X배너 검증
            const xCount = Number(currentRequest.실내용X배너개수 || 0) + Number(currentRequest.실외용X배너개수 || 0);
            if (xCount > 0 && currentRequest.x배너디자인.length === 0) {
                return alert('X배너 수량을 입력하셨습니다. 디자인을 최소 1개 이상 선택해주세요.');
            }

            // 2. 현수막 검증
            if ((currentRequest.현수막가로 || currentRequest.현수막세로) && !currentRequest.현수막디자인) {
                return alert('현수막 사이즈를 입력하셨습니다. 디자인 타입을 선택해주세요.');
            }
        }
        
        setStep(prev => prev + 1);
    };

    // 최종 제출
    const handleSubmit = async () => {
        if (!dueDate) return alert('마감기한을 입력해주세요.');
        if (!confirm('신청하시겠습니까?')) return;

        setLoading(true);
        try {
            const payload = {
                요청자: requester,
                마트명: selectedMart.name,
                마트Id: selectedMart.id,
                마감기한: dueDate,
                ...currentRequest
            };
            
            const res = await fetch('/api/submit', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                 throw new Error("서버 오류가 발생했습니다. (Not JSON Response)");
            }

            const result = await res.json();

            if (result.success) {
                alert('요청이 완료되었습니다.');
                window.location.reload();
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            alert('오류 발생: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // 디자인 모달 열기
    const openModal = (type) => {
        setDesignModalType(type);
        setShowDesignModal(true);
    };

    return (
        <div className={styles.container}>
            {/* 상단 진행바 */}
            <div className={styles.progressBar}>
                <div 
                    className={`${styles.stepItem} ${step >= 1 ? styles.activeStep : ''} ${styles.clickableStep}`}
                    onClick={() => handleStepClick(1)}
                >
                    1. 기본정보
                </div>
                <div 
                    className={`${styles.stepItem} ${step >= 2 ? styles.activeStep : ''} ${step >= 2 ? styles.clickableStep : ''}`}
                    onClick={() => handleStepClick(2)}
                >
                    2. 품목선택
                </div>
                <div className={`${styles.stepItem} ${step >= 3 ? styles.activeStep : ''}`}>
                    3. 신청완료
                </div>
            </div>

            <div className={styles.card}>
                
                {/* STEP 1: 기본 정보 및 마트 선택 */}
                {step === 1 && (
                    <div className={styles.stepContent}>
                        <h2 className={styles.title}>누가, 어떤 마트를 요청하나요?</h2>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.label}>요청자 선택</label>
                            <input 
                                list="users-list" 
                                className={styles.input} 
                                value={requester} 
                                onChange={(e) => setRequester(e.target.value)} 
                                placeholder="이름을 검색하세요"
                            />
                            <datalist id="users-list">
                                {users.map((u, i) => <option key={i} value={u} />)}
                            </datalist>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>마트 검색</label>
                            <input 
                                type="text" 
                                className={styles.input} 
                                value={martSearch} 
                                onChange={(e) => setMartSearch(e.target.value)} 
                                placeholder="마트명을 입력하세요 (예: 럭키)"
                            />
                            
                            {/* 마트 선택 테이블 */}
                            <div className={styles.tableWrapper}>
                                <table className={styles.martTable}>
                                    <thead>
                                        <tr>
                                            <th>마트명</th>
                                            <th>담당자</th>
                                            <th>상태</th>
                                            <th className={styles.hideOnMobile}>등록일</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMarts.length > 0 ? filteredMarts.map((mart) => (
                                            <tr 
                                                key={mart.id} 
                                                className={`${styles.martRow} ${selectedMart?.id === mart.id ? styles.selectedRow : ''} ${!mart.orderable ? styles.disabledRow : ''}`}
                                                onClick={() => handleMartSelect(mart)}
                                            >
                                                <td>{mart.name}</td>
                                                <td>{mart.manager}</td>
                                                <td>
                                                    <span className={mart.orderable ? styles.statusOk : styles.statusNo}>
                                                        {mart.orderable ? '가능' : '불가'}
                                                    </span>
                                                </td>
                                                <td className={styles.hideOnMobile}>{mart.date}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="4" className={styles.noResult}>검색 결과가 없습니다.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {selectedMart && <p className={styles.selectionMsg}>선택된 마트: <strong>{selectedMart.name}</strong> ({selectedMart.manager})</p>}
                        </div>

                        <button className={styles.nextBtn} onClick={goNext}>다음 단계로 →</button>
                    </div>
                )}

                {/* STEP 2: 품목 입력 */}
                {step === 2 && (
                    <div className={styles.stepContent}>
                        <h2 className={styles.title}>{selectedMart?.name}에 필요한 물품은?</h2>
                        
                        {/* 탭 메뉴 */}
                        <div className={styles.tabs}>
                            {['tab1', 'tab2', 'tab3', 'tab4', 'tab5', 'tab6'].map((tab, idx) => (
                                <button 
                                    key={tab} 
                                    className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {['X배너', '현수막', '전단지', '기타', '디자인', '자료실'][idx]}
                                </button>
                            ))}
                        </div>

                        {/* 탭 콘텐츠 */}
                        <div className={styles.tabBody}>
                            {/* X배너 */}
                            {activeTab === 'tab1' && (
                                <div>
                                    <div className={styles.row}>
                                        <label>실내용 개수 
                                            <input 
                                                type="number" 
                                                min="0" 
                                                className={styles.input} 
                                                value={currentRequest.실내용X배너개수} 
                                                onChange={(e) => handleNumberChange(e, '실내용X배너개수')} 
                                            />
                                        </label>
                                        <label>실외용 개수 
                                            <input 
                                                type="number" 
                                                min="0" 
                                                className={styles.input} 
                                                value={currentRequest.실외용X배너개수} 
                                                onChange={(e) => handleNumberChange(e, '실외용X배너개수')} 
                                            />
                                        </label>
                                    </div>
                                    
                                    <h4 className={styles.subTitle}>디자인 선택</h4>
                                    
                                    {/* 모바일: 모달 열기 버튼 */}
                                    <div className={styles.mobileOnly}>
                                        <button className={styles.openModalBtn} onClick={() => openModal('xbanner')}>🎨 디자인 이미지 확인 및 선택</button>
                                        <div className={styles.selectedSummary}>
                                            선택됨: {currentRequest.x배너디자인.length > 0 ? currentRequest.x배너디자인.join(', ') : '없음'}
                                        </div>
                                    </div>

                                    {/* 데스크탑: 그리드 표시 */}
                                    <div className={`${styles.imageGrid} ${styles.desktopOnly}`}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                            <label key={num} className={`${styles.imgLabel} ${currentRequest.x배너디자인.includes(`type${num}`) ? styles.selectedImg : ''}`}>
                                                <img src={`https://fs.qmk.me/template-xbanner-${num}.png`} alt={`디자인 ${num}`} />
                                                <input type="checkbox" checked={currentRequest.x배너디자인.includes(`type${num}`)} onChange={() => handleXBannerCheck(`type${num}`)} hidden />
                                                <span>{num}번</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 현수막 */}
                            {activeTab === 'tab2' && (
                                <div>
                                    <div className={styles.row}>
                                        <label>가로(cm) 
                                            <input 
                                                type="number" 
                                                min="0" 
                                                className={styles.input} 
                                                value={currentRequest.현수막가로} 
                                                onChange={(e) => handleNumberChange(e, '현수막가로')} 
                                            />
                                        </label>
                                        <label>세로(cm) 
                                            <input 
                                                type="number" 
                                                min="0" 
                                                className={styles.input} 
                                                value={currentRequest.현수막세로} 
                                                onChange={(e) => handleNumberChange(e, '현수막세로')} 
                                            />
                                        </label>
                                    </div>
                                    
                                    <h4 className={styles.subTitle}>디자인 타입</h4>
                                    
                                    {/* 모바일: 모달 열기 */}
                                    <div className={styles.mobileOnly}>
                                        <button className={styles.openModalBtn} onClick={() => openModal('banner')}>🎨 현수막 디자인 확인</button>
                                        <div className={styles.selectedSummary}>선택됨: {currentRequest.현수막디자인 || '미선택'}</div>
                                    </div>

                                    {/* 데스크탑: 세로형 리스트 (이미지 크게) */}
                                    <div className={`${styles.bannerGrid} ${styles.desktopOnly}`}>
                                        <label className={`${styles.bannerLabel} ${currentRequest.현수막디자인 === 'type1' ? styles.selectedBanner : ''}`}>
                                            <input type="radio" name="banner" value="type1" checked={currentRequest.현수막디자인 === 'type1'} onChange={() => setCurrentRequest({...currentRequest, 현수막디자인: 'type1'})} hidden />
                                            <img src="https://fs.qmk.me/template-banner-1.png" alt="현수막1" onError={(e) => e.target.src='https://placehold.co/400x100?text=Design+1'} />
                                            <span>디자인 1</span>
                                        </label>
                                        <label className={`${styles.bannerLabel} ${currentRequest.현수막디자인 === 'type2' ? styles.selectedBanner : ''}`}>
                                            <input type="radio" name="banner" value="type2" checked={currentRequest.현수막디자인 === 'type2'} onChange={() => setCurrentRequest({...currentRequest, 현수막디자인: 'type2'})} hidden />
                                            <img src="https://fs.qmk.me/template-banner-2.png" alt="현수막2" onError={(e) => e.target.src='https://placehold.co/400x100?text=Design+2'} />
                                            <span>디자인 2</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* 나머지 탭 */}
                            {activeTab === 'tab3' && (
                                <div className={styles.row}>
                                    <label>가로 
                                        <input 
                                            type="number" 
                                            min="0" 
                                            className={styles.input} 
                                            value={currentRequest.전단지가로} 
                                            onChange={(e) => handleNumberChange(e, '전단지가로')} 
                                        />
                                    </label>
                                    <label>세로 
                                        <input 
                                            type="number" 
                                            min="0" 
                                            className={styles.input} 
                                            value={currentRequest.전단지세로} 
                                            onChange={(e) => handleNumberChange(e, '전단지세로')} 
                                        />
                                    </label>
                                </div>
                            )}
                            {activeTab === 'tab4' && (
                                <textarea className={styles.textarea} placeholder="기타 요청사항" value={currentRequest.기타} onChange={e=>setCurrentRequest({...currentRequest, 기타:e.target.value})}></textarea>
                            )}
                            {activeTab === 'tab5' && (
                                <div className={styles.row}>
                                    <label>용도 <input type="text" className={styles.input} value={currentRequest.디자인용도} onChange={e=>setCurrentRequest({...currentRequest, 디자인용도:e.target.value})}/></label>
                                    <label>사이즈 <input type="text" className={styles.input} value={currentRequest.디자인사이즈} onChange={e=>setCurrentRequest({...currentRequest, 디자인사이즈:e.target.value})}/></label>
                                </div>
                            )}
                            {activeTab === 'tab6' && (
                                <div style={{textAlign:'center', padding:'20px'}}>
                                    <a href="https://drive.google.com/" target="_blank" className={styles.linkBtn}>📂 구글 드라이브 바로가기</a>
                                </div>
                            )}
                        </div>

                        <div className={styles.btnGroup}>
                            <button className={styles.prevBtn} onClick={() => setStep(1)}>← 이전</button>
                            <button className={styles.nextBtn} onClick={goNext}>다음 (마감일 선택) →</button>
                        </div>
                    </div>
                )}

                {/* STEP 3: 마감일 및 제출 */}
                {step === 3 && (
                    <div className={styles.stepContent}>
                        <h2 className={styles.title}>마지막으로 확인해주세요.</h2>
                        
                        <div className={styles.summaryCard}>
                            <p><strong>요청자:</strong> {requester}</p>
                            <p><strong>마트명:</strong> {selectedMart?.name} <small>({selectedMart?.manager})</small></p>
                            <hr className={styles.divider}/>
                            <p><strong>요청 내역 요약:</strong></p>
                            <ul className={styles.summaryList}>
                                {currentRequest.실내용X배너개수 > 0 && <li>실내 X배너: {currentRequest.실내용X배너개수}개</li>}
                                {currentRequest.실외용X배너개수 > 0 && <li>실외 X배너: {currentRequest.실외용X배너개수}개</li>}
                                {currentRequest.x배너디자인.length > 0 && <li>X배너 디자인: {currentRequest.x배너디자인.join(', ')}</li>}
                                {currentRequest.현수막가로 && <li>현수막: {currentRequest.현수막가로}x{currentRequest.현수막세로} ({currentRequest.현수막디자인})</li>}
                                {currentRequest.전단지가로 && <li>전단지: {currentRequest.전단지가로}x{currentRequest.전단지세로}</li>}
                                {currentRequest.기타 && <li>기타: {currentRequest.기타}</li>}
                            </ul>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>희망 마감일</label>
                            <input type="date" className={styles.input} min={minDate} value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
                        </div>

                        <div className={styles.btnGroup}>
                            <button className={styles.prevBtn} onClick={() => setStep(2)}>← 품목 수정</button>
                            <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
                                {loading ? '신청 중...' : '신청하기'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 모달 */}
            {showDesignModal && (
                <div className={styles.modalOverlay} onClick={() => setShowDesignModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3>{designModalType === 'xbanner' ? 'X배너 디자인 선택' : '현수막 디자인 선택'}</h3>
                        <p className={styles.modalDesc}>터치하여 선택하세요.</p>
                        
                        <div className={designModalType === 'xbanner' ? styles.modalGrid : styles.modalBannerStack}>
                            {designModalType === 'xbanner' ? (
                                [1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                    <label key={num} className={`${styles.imgLabel} ${currentRequest.x배너디자인.includes(`type${num}`) ? styles.selectedImg : ''}`}>
                                        <img src={`https://fs.qmk.me/template-xbanner-${num}.png`} alt={`디자인 ${num}`} />
                                        <input type="checkbox" checked={currentRequest.x배너디자인.includes(`type${num}`)} onChange={() => handleXBannerCheck(`type${num}`)} hidden />
                                        <span>{num}번</span>
                                    </label>
                                ))
                            ) : (
                                <>
                                    <label className={`${styles.bannerLabel} ${currentRequest.현수막디자인 === 'type1' ? styles.selectedBanner : ''}`}>
                                        <input type="radio" name="modal_banner" value="type1" checked={currentRequest.현수막디자인 === 'type1'} onChange={() => setCurrentRequest({...currentRequest, 현수막디자인: 'type1'})} hidden />
                                        <img src="https://fs.qmk.me/template-banner-1.png" alt="현수막1" onError={(e) => e.target.src='https://placehold.co/400x100?text=Design+1'}/>
                                        <span>디자인 1</span>
                                    </label>
                                    <label className={`${styles.bannerLabel} ${currentRequest.현수막디자인 === 'type2' ? styles.selectedBanner : ''}`}>
                                        <input type="radio" name="modal_banner" value="type2" checked={currentRequest.현수막디자인 === 'type2'} onChange={() => setCurrentRequest({...currentRequest, 현수막디자인: 'type2'})} hidden />
                                        <img src="https://fs.qmk.me/template-banner-2.png" alt="현수막2" onError={(e) => e.target.src='https://placehold.co/400x100?text=Design+2'}/>
                                        <span>디자인 2</span>
                                    </label>
                                </>
                            )}
                        </div>
                        <button className={styles.closeModalBtn} onClick={() => setShowDesignModal(false)}>선택 완료</button>
                    </div>
                </div>
            )}
        </div>
    );
}

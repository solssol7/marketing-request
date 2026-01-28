// src/components/Step2_Items.js
import styles from '../app/page.module.css';

export default function Step2_Items({
    selectedMart,
    activeTab,
    setActiveTab,
    currentRequest,
    handleNumberChange,
    handleXBannerCheck,
    handleBannerTypeChange, // 현수막 타입 변경 핸들러
    handleTextChange, // 일반 텍스트 변경 핸들러
    openModal,
    onPrev,
    onNext
}) {
    const tabs = ['X배너', '현수막', '전단지', '기타', '디자인', '자료실'];
    const tabIds = ['tab1', 'tab2', 'tab3', 'tab4', 'tab5', 'tab6'];

    return (
        <div className={styles.stepContent}>
            <h2 className={styles.title}>{selectedMart?.name}에 필요한 물품은?</h2>
            
            <div className={styles.tabs}>
                {tabIds.map((tab, idx) => (
                    <button 
                        key={tab} 
                        className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tabs[idx]}
                    </button>
                ))}
            </div>

            <div className={styles.tabBody}>
                {/* Tab 1: X배너 */}
                {activeTab === 'tab1' && (
                    <div>
                        <div className={styles.row}>
                            <label>실내용 개수 <input type="number" min="0" className={styles.input} value={currentRequest.실내용X배너개수} onChange={(e) => handleNumberChange(e, '실내용X배너개수')} /></label>
                            <label>실외용 개수 <input type="number" min="0" className={styles.input} value={currentRequest.실외용X배너개수} onChange={(e) => handleNumberChange(e, '실외용X배너개수')} /></label>
                        </div>
                        
                        <h4 className={styles.subTitle}>디자인 선택</h4>
                        <div className={styles.mobileOnly}>
                            <button className={styles.openModalBtn} onClick={() => openModal('xbanner')}>🎨 디자인 이미지 확인 및 선택</button>
                            <div className={styles.selectedSummary}>선택됨: {currentRequest.x배너디자인.length > 0 ? currentRequest.x배너디자인.join(', ') : '없음'}</div>
                        </div>

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

                {/* Tab 2: 현수막 */}
                {activeTab === 'tab2' && (
                    <div>
                        <div className={styles.row}>
                            <label>가로(cm) <input type="number" min="0" className={styles.input} value={currentRequest.현수막가로} onChange={(e) => handleNumberChange(e, '현수막가로')} /></label>
                            <label>세로(cm) <input type="number" min="0" className={styles.input} value={currentRequest.현수막세로} onChange={(e) => handleNumberChange(e, '현수막세로')} /></label>
                        </div>
                        <h4 className={styles.subTitle}>디자인 타입</h4>
                        <div className={styles.mobileOnly}>
                            <button className={styles.openModalBtn} onClick={() => openModal('banner')}>🎨 현수막 디자인 확인</button>
                            <div className={styles.selectedSummary}>선택됨: {currentRequest.현수막디자인 || '미선택'}</div>
                        </div>

                        <div className={`${styles.bannerGrid} ${styles.desktopOnly}`}>
                            {['type1', 'type2'].map((type, idx) => (
                                <label key={type} className={`${styles.bannerLabel} ${currentRequest.현수막디자인 === type ? styles.selectedBanner : ''}`}>
                                    <input type="radio" name="banner" value={type} checked={currentRequest.현수막디자인 === type} onChange={() => handleBannerTypeChange(type)} hidden />
                                    <img src={`https://fs.qmk.me/template-banner-${idx + 1}.png`} alt={`디자인 ${idx + 1}`} onError={(e) => e.target.src='https://placehold.co/400x100?text=Design'} />
                                    <span>디자인 {idx + 1}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* 나머지 탭들 */}
                {activeTab === 'tab3' && <div className={styles.row}><label>가로 <input type="number" min="0" className={styles.input} value={currentRequest.전단지가로} onChange={(e)=>handleNumberChange(e, '전단지가로')}/></label><label>세로 <input type="number" min="0" className={styles.input} value={currentRequest.전단지세로} onChange={(e)=>handleNumberChange(e, '전단지세로')}/></label></div>}
                {activeTab === 'tab4' && <textarea className={styles.textarea} placeholder="기타 요청사항" value={currentRequest.기타} onChange={(e) => handleTextChange(e, '기타')}></textarea>}
                {activeTab === 'tab5' && <div className={styles.row}><label>용도 <input type="text" className={styles.input} value={currentRequest.디자인용도} onChange={(e) => handleTextChange(e, '디자인용도')}/></label><label>사이즈 <input type="text" className={styles.input} value={currentRequest.디자인사이즈} onChange={(e) => handleTextChange(e, '디자인사이즈')}/></label></div>}
                {activeTab === 'tab6' && <div style={{textAlign:'center', padding:'20px'}}><a href="https://drive.google.com/" target="_blank" className={styles.linkBtn}>📂 구글 드라이브 바로가기</a></div>}
            </div>

            <div className={styles.btnGroup}>
                <button className={styles.prevBtn} onClick={onPrev}>← 이전</button>
                <button className={styles.nextBtn} onClick={onNext}>다음 (마감일 선택) →</button>
            </div>
        </div>
    );
}

import common from '../app/page.module.css';
import styles from './Step2.module.css';

export default function Step2_Items({
    selectedMart, activeTab, setActiveTab, currentRequest,
    handleNumberChange, handleXBannerCheck, handleBannerTypeChange, handleTextChange,
    openModal, onPrev, onNext
}) {
    // --- 설정: 디자인 개수 (나중에 숫자가 바뀌면 여기만 수정하세요) ---
    const X_BANNER_COUNT = 16; // 현재 X배너 디자인 1~16번
    const BANNER_COUNT = 6;    // 현재 현수막 디자인 1~6번

    const tabs = ['X배너', '현수막', '전단지', '기타', '디자인', '자료실'];
    const tabIds = ['tab1', 'tab2', 'tab3', 'tab4', 'tab5', 'tab6'];

    const xBannerList = Array.from({ length: X_BANNER_COUNT }, (_, i) => i + 1);
    const bannerList = Array.from({ length: BANNER_COUNT }, (_, i) => i + 1);

    // [New] 현재 어떤 품목들이 담겼는지 요약하는 함수
    const getSelectionSummary = () => {
        const items = [];
        const xCount = Number(currentRequest.실내용X배너개수 || 0) + Number(currentRequest.실외용X배너개수 || 0);
        
        if (xCount > 0) items.push(`X배너(${xCount}개)`);
        if (currentRequest.현수막가로 || currentRequest.현수막세로) items.push(`현수막`);
        if (currentRequest.전단지가로 || currentRequest.전단지세로) items.push(`전단지`);
        if (currentRequest.디자인용도) items.push(`디자인`);
        if (currentRequest.기타) items.push(`기타`);
        
        return items;
    };

    const selectedItems = getSelectionSummary();

    return (
        <div className={common.stepContent}>
            <h2 className={common.title}>{selectedMart?.name} 품목 선택</h2>
            
            {/* [New] 상단 선택 요약 바: 무엇을 담았는지 한눈에 확인 */}
            <div className={styles.selectionSummaryBar}>
                <span className={styles.summaryLabel}>현재 선택 내역:</span>
                <div className={styles.tagContainer}>
                    {selectedItems.length > 0 ? (
                        selectedItems.map((item, idx) => (
                            <span key={idx} className={styles.itemTag}>{item}</span>
                        ))
                    ) : (
                        <span className={styles.emptyText}>선택된 품목이 없습니다.</span>
                    )}
                </div>
            </div>

            <div className={styles.tabsWrapper}>
                <div className={styles.tabs}>
                    {tabIds.map((tab, idx) => (
                        <button key={tab} className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ''}`} onClick={() => setActiveTab(tab)}>
                            {tabs[idx]}
                        </button>
                    ))}
                </div>
                <div className={styles.scrollHint} />
            </div>

            <div className={styles.tabBody}>
                {/* Tab 1: X배너 */}
                {activeTab === 'tab1' && (
                    <div className={styles.fadeIn}>
                        <div className={common.row}>
                            <label className={common.label}>실내용 개수 <input type="number" min="0" className={common.input} value={currentRequest.실내용X배너개수} onChange={(e) => handleNumberChange(e, '실내용X배너개수')} /></label>
                            <label className={common.label}>실외용 개수 <input type="number" min="0" className={common.input} value={currentRequest.실외용X배너개수} onChange={(e) => handleNumberChange(e, '실외용X배너개수')} /></label>
                        </div>
                        <h4 className={styles.subTitle}>디자인 선택</h4>
                        <div className={common.mobileOnly}>
                            <button className={styles.openModalBtn} onClick={() => openModal('xbanner')}>🎨 디자인 이미지 확인 및 선택</button>
                            <div className={styles.selectedSummaryText}>선택됨: {currentRequest.x배너디자인.length > 0 ? currentRequest.x배너디자인.join(', ') : '없음'}</div>
                        </div>
                        <div className={`${styles.imageGrid} ${common.desktopOnly}`}>
                            {xBannerList.map(num => (
                                <label key={num} className={`${styles.imgLabel} ${currentRequest.x배너디자인.includes(`type${num}`) ? styles.selectedImg : ''}`}>
                                    <img src={`https://fs.qmk.me/template-xbanner-${num}-202601.webp`} alt={`디자인 ${num}`} loading="lazy" />
                                    <input type="checkbox" checked={currentRequest.x배너디자인.includes(`type${num}`)} onChange={() => handleXBannerCheck(`type${num}`)} hidden />
                                    <span>{num}번</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab 2: 현수막 */}
                {activeTab === 'tab2' && (
                    <div className={styles.fadeIn}>
                        <div className={common.row}>
                            <label className={common.label}>가로(cm) <input type="number" min="0" className={common.input} value={currentRequest.현수막가로} onChange={(e) => handleNumberChange(e, '현수막가로')} /></label>
                            <label className={common.label}>세로(cm) <input type="number" min="0" className={common.input} value={currentRequest.현수막세로} onChange={(e) => handleNumberChange(e, '현수막세로')} /></label>
                        </div>
                        <h4 className={styles.subTitle}>디자인 타입</h4>
                        <div className={common.mobileOnly}>
                            <button className={styles.openModalBtn} onClick={() => openModal('banner')}>🎨 현수막 디자인 확인</button>
                            <div className={styles.selectedSummaryText}>선택됨: {currentRequest.현수막디자인 || '미선택'}</div>
                        </div>
                        <div className={`${styles.bannerGrid} ${common.desktopOnly}`}>
                            {bannerList.map((num) => (
                                <label key={num} className={`${styles.bannerLabel} ${currentRequest.현수막디자인 === `type${num}` ? styles.selectedBanner : ''}`}>
                                    <input type="radio" name="banner" value={`type${num}`} checked={currentRequest.현수막디자인 === `type${num}`} onChange={() => handleBannerTypeChange(`type${num}`)} hidden />
                                    <img src={`https://fs.qmk.me/template-banner-${num}-202601.webp`} alt={`디자인 ${num}`} onError={(e) => e.target.src='https://placehold.co/600x150?text=Design'} loading="lazy" />
                                    <span>디자인 {num}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab 3: 전단지 */}
                {activeTab === 'tab3' && (
                    <div className={styles.fadeIn}>
                        <div className={common.row}>
                            <label className={common.label}>가로 <input type="number" min="0" className={common.input} value={currentRequest.전단지가로} onChange={(e)=>handleNumberChange(e, '전단지가로')}/></label>
                            <label className={common.label}>세로 <input type="number" min="0" className={common.input} value={currentRequest.전단지세로} onChange={(e)=>handleNumberChange(e, '전단지세로')}/></label>
                        </div>
                        <div className={common.formGroup}>
                            <label className={common.label}>전단지 디자인 요청사항</label>
                            <textarea className={common.textarea} placeholder="전단지에 들어갈 내용을 입력해주세요." value={currentRequest.전단지디자인} onChange={(e) => handleTextChange(e, '전단지디자인')}></textarea>
                        </div>
                    </div>
                )}

                {/* Tab 4: 기타 */}
                {activeTab === 'tab4' && (
                    <div className={`${common.formGroup} ${styles.fadeIn}`}>
                        <label className={common.label}>기타 요청사항</label>
                        <textarea className={common.textarea} placeholder="기타 요청사항을 자세히 적어주세요." value={currentRequest.기타} onChange={(e) => handleTextChange(e, '기타')}></textarea>
                    </div>
                )}

                {/* Tab 5: 디자인 */}
                {activeTab === 'tab5' && (
                    <div className={`${common.row} ${styles.fadeIn}`}>
                        <label className={common.label}>용도 <input type="text" className={common.input} value={currentRequest.디자인용도} onChange={(e) => handleTextChange(e, '디자인용도')}/></label>
                        <label className={common.label}>사이즈 <input type="text" className={common.input} value={currentRequest.디자인사이즈} onChange={(e) => handleTextChange(e, '디자인사이즈')}/></label>
                    </div>
                )}
                
                {/* Tab 6: 자료실 */}
                {activeTab === 'tab6' && (
                    <div className={`${styles.refContainer} ${styles.fadeIn}`}>
                        <div className={styles.refDesc}>
                            <p><strong>QR 코드</strong>를 스캔하거나 버튼을 눌러<br/>공용 문서함 및 디자인 리소스를 확인하세요.</p>
                        </div>
                        <div className={styles.qrWrapper}>
                            <img src="/qrcode_hd.png" alt="Google Drive QR Code" className={styles.qrImage} />
                            <a href="/qrcode_hd.png" download="Qmarket_QR_HD.png" className={styles.downloadBtn}>⬇ QR 다운로드</a>
                        </div>
                        <a href="https://drive.google.com/drive/folders/1LCkZ-fryH7aWBll2zH_qp9NwfalGKQU0" target="_blank" className={styles.driveLinkBtn}>
                            📂 구글 드라이브 열기
                        </a>
                    </div>
                )}
            </div>

            {/* 하단 스티키 버튼 그룹 */}
            <div className={styles.stickyBtnGroup}>
                <button className={common.prevBtn} onClick={onPrev}>← 이전</button>
                <button className={common.nextBtn} onClick={onNext}>다음 (마감일 선택) →</button>
            </div>
        </div>
    );
}

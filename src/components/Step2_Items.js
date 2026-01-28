import common from '../app/page.module.css';
import styles from './Step2.module.css';

export default function Step2_Items({
    selectedMart, activeTab, setActiveTab, currentRequest,
    handleNumberChange, handleXBannerCheck, handleBannerTypeChange, handleTextChange,
    openModal, onPrev, onNext
}) {
    const tabs = ['X배너', '현수막', '전단지', '기타', '디자인', '자료실'];
    const tabIds = ['tab1', 'tab2', 'tab3', 'tab4', 'tab5', 'tab6'];

    // X배너 (1~16번), 현수막 (1~6번) 배열 생성
    const xBannerList = Array.from({ length: 16 }, (_, i) => i + 1);
    const bannerList = Array.from({ length: 6 }, (_, i) => i + 1);

    return (
        <div className={common.stepContent}>
            <h2 className={common.title}>{selectedMart?.name}에 필요한 물품은?</h2>
            
            <p className={common.guideText}>
                2. 필요한 품목을 선택하면 여러 종류를 한꺼번에 신청이 가능합니다.
            </p>

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
                    <div>
                        <div className={common.row}>
                            <label className={common.label}>실내용 개수 <input type="number" min="0" className={common.input} value={currentRequest.실내용X배너개수} onChange={(e) => handleNumberChange(e, '실내용X배너개수')} /></label>
                            <label className={common.label}>실외용 개수 <input type="number" min="0" className={common.input} value={currentRequest.실외용X배너개수} onChange={(e) => handleNumberChange(e, '실외용X배너개수')} /></label>
                        </div>
                        <h4 className={styles.subTitle}>디자인 선택</h4>
                        <div className={common.mobileOnly}>
                            <button className={styles.openModalBtn} onClick={() => openModal('xbanner')}>🎨 디자인 이미지 확인 및 선택</button>
                            <div className={styles.selectedSummary}>선택됨: {currentRequest.x배너디자인.length > 0 ? currentRequest.x배너디자인.join(', ') : '없음'}</div>
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
                    <div>
                        <div className={common.row}>
                            <label className={common.label}>가로(cm) <input type="number" min="0" className={common.input} value={currentRequest.현수막가로} onChange={(e) => handleNumberChange(e, '현수막가로')} /></label>
                            <label className={common.label}>세로(cm) <input type="number" min="0" className={common.input} value={currentRequest.현수막세로} onChange={(e) => handleNumberChange(e, '현수막세로')} /></label>
                        </div>
                        <h4 className={styles.subTitle}>디자인 타입</h4>
                        <div className={common.mobileOnly}>
                            <button className={styles.openModalBtn} onClick={() => openModal('banner')}>🎨 현수막 디자인 확인</button>
                            <div className={styles.selectedSummary}>선택됨: {currentRequest.현수막디자인 || '미선택'}</div>
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

                {/* 나머지 탭 */}
                {activeTab === 'tab3' && <div className={common.row}><label className={common.label}>가로 <input type="number" min="0" className={common.input} value={currentRequest.전단지가로} onChange={(e)=>handleNumberChange(e, '전단지가로')}/></label><label className={common.label}>세로 <input type="number" min="0" className={common.input} value={currentRequest.전단지세로} onChange={(e)=>handleNumberChange(e, '전단지세로')}/></label></div>}
                {activeTab === 'tab4' && <textarea className={common.textarea} placeholder="기타 요청사항을 자세히 적어주세요." value={currentRequest.기타} onChange={(e) => handleTextChange(e, '기타')}></textarea>}
                {activeTab === 'tab5' && <div className={common.row}><label className={common.label}>용도 <input type="text" className={common.input} value={currentRequest.디자인용도} onChange={(e) => handleTextChange(e, '디자인용도')}/></label><label className={common.label}>사이즈 <input type="text" className={common.input} value={currentRequest.디자인사이즈} onChange={(e) => handleTextChange(e, '디자인사이즈')}/></label></div>}
                
                {/* Tab 6: 자료실 (고해상도 QR 적용) */}
                {activeTab === 'tab6' && (
                    <div className={styles.refContainer}>
                        <div className={styles.refDesc}>
                            <p><strong>QR 코드</strong>를 스캔하거나 버튼을 눌러<br/>공용 문서함 및 디자인 리소스를 확인하세요.</p>
                        </div>
                        
                        <div className={styles.qrWrapper}>
                            {/* 화면엔 적당한 크기로 표시하지만, 다운로드는 원본(HD) 파일 연결 */}
                            <img src="/qrcode_hd.png" alt="Google Drive QR Code" className={styles.qrImage} />
                            
                            <a href="/qrcode_hd.png" download="Qmarket_QR_HD.png" className={styles.downloadBtn}>
                                ⬇ 고해상도 QR 다운로드
                            </a>
                        </div>
                        
                        <a href="https://drive.google.com/drive/folders/1LCkZ-fryH7aWBll2zH_qp9NwfalGKQU0" target="_blank" className={styles.driveLinkBtn}>
                            📂 구글 드라이브 열기
                        </a>
                    </div>
                )}
            </div>

            <div className={common.btnGroup}>
                <button className={common.prevBtn} onClick={onPrev}>← 이전</button>
                <button className={common.nextBtn} onClick={onNext}>다음 (마감일 선택) →</button>
            </div>
        </div>
    );
}

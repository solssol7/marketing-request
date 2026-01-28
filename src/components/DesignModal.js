import styles from './Modal.module.css';
import itemStyles from './Step2.module.css'; // 이미지 스타일 재사용

export default function DesignModal({
    isOpen, onClose, type, currentRequest, handleXBannerCheck, handleBannerTypeChange
}) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.content} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>{type === 'xbanner' ? 'X배너 디자인' : '현수막 디자인'}</h3>
                    <span className={styles.closeIcon} onClick={onClose}>&times;</span>
                </div>
                
                <div className={styles.body}>
                    <p className={styles.desc}>원하는 디자인을 터치하여 선택하세요.</p>
                    
                    <div className={type === 'xbanner' ? styles.grid : styles.stack}>
                        {type === 'xbanner' ? (
                            [1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                <label key={num} className={`${itemStyles.imgLabel} ${currentRequest.x배너디자인.includes(`type${num}`) ? itemStyles.selectedImg : ''}`}>
                                    <img src={`https://fs.qmk.me/template-xbanner-${num}.png`} alt={`디자인 ${num}`} />
                                    <input type="checkbox" checked={currentRequest.x배너디자인.includes(`type${num}`)} onChange={() => handleXBannerCheck(`type${num}`)} hidden />
                                    <span>{num}번</span>
                                </label>
                            ))
                        ) : (
                            ['type1', 'type2'].map((bType, idx) => (
                                <label key={bType} className={`${itemStyles.bannerLabel} ${currentRequest.현수막디자인 === bType ? itemStyles.selectedBanner : ''}`}>
                                    <input type="radio" name="modal_banner" value={bType} checked={currentRequest.현수막디자인 === bType} onChange={() => handleBannerTypeChange(bType)} hidden />
                                    <img src={`https://fs.qmk.me/template-banner-${idx + 1}.png`} alt={`디자인 ${idx + 1}`} onError={(e) => e.target.src='https://placehold.co/400x100?text=Design'}/>
                                    <span>디자인 {idx + 1}</span>
                                </label>
                            ))
                        )}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.confirmBtn} onClick={onClose}>선택 완료</button>
                </div>
            </div>
        </div>
    );
}

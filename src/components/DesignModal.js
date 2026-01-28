// src/components/DesignModal.js
import styles from '../app/page.module.css';

export default function DesignModal({
    isOpen,
    onClose,
    type, // 'xbanner' or 'banner'
    currentRequest,
    handleXBannerCheck,
    handleBannerTypeChange
}) {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3>{type === 'xbanner' ? 'X배너 디자인 선택' : '현수막 디자인 선택'}</h3>
                <p className={styles.modalDesc}>터치하여 선택하세요.</p>
                
                <div className={type === 'xbanner' ? styles.modalGrid : styles.modalBannerStack}>
                    {type === 'xbanner' ? (
                        [1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                            <label key={num} className={`${styles.imgLabel} ${currentRequest.x배너디자인.includes(`type${num}`) ? styles.selectedImg : ''}`}>
                                <img src={`https://fs.qmk.me/template-xbanner-${num}.png`} alt={`디자인 ${num}`} />
                                <input type="checkbox" checked={currentRequest.x배너디자인.includes(`type${num}`)} onChange={() => handleXBannerCheck(`type${num}`)} hidden />
                                <span>{num}번</span>
                            </label>
                        ))
                    ) : (
                        ['type1', 'type2'].map((bType, idx) => (
                            <label key={bType} className={`${styles.bannerLabel} ${currentRequest.현수막디자인 === bType ? styles.selectedBanner : ''}`}>
                                <input type="radio" name="modal_banner" value={bType} checked={currentRequest.현수막디자인 === bType} onChange={() => handleBannerTypeChange(bType)} hidden />
                                <img src={`https://fs.qmk.me/template-banner-${idx + 1}.png`} alt={`디자인 ${idx + 1}`} onError={(e) => e.target.src='https://placehold.co/400x100?text=Design'}/>
                                <span>디자인 {idx + 1}</span>
                            </label>
                        ))
                    )}
                </div>
                <button className={styles.closeModalBtn} onClick={onClose}>선택 완료</button>
            </div>
        </div>
    );
}

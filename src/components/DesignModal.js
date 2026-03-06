/* src/components/DesignModal.js */
import styles from './Modal.module.css';
import itemStyles from './Step2.module.css';

export default function DesignModal({
    isOpen, onClose, type, currentRequest, handleXBannerCheck, handleBannerTypeChange
}) {
    if (!isOpen) return null;

    // --- 설정: Step2_Items.js와 동일하게 맞춰주세요 ---
    const X_BANNER_COUNT = 16; 
    const BANNER_COUNT = 6;    

    const xBannerList = Array.from({ length: X_BANNER_COUNT }, (_, i) => i + 1);
    const bannerList = Array.from({ length: BANNER_COUNT }, (_, i) => i + 1);

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
                            xBannerList.map(num => (
                                <label key={num} className={`${itemStyles.imgLabel} ${currentRequest.x배너디자인.includes(`type${num}`) ? itemStyles.selectedImg : ''}`}>
                                    <img src={`https://fs.qmk.me/template-xbanner-${num}-202601.webp`} alt={`디자인 ${num}`} loading="lazy" />
                                    <input type="checkbox" checked={currentRequest.x배너디자인.includes(`type${num}`)} onChange={() => handleXBannerCheck(`type${num}`)} hidden />
                                    <span>{num}번</span>
                                </label>
                            ))
                        ) : (
                            bannerList.map(num => (
                                <label key={num} className={`${itemStyles.bannerLabel} ${currentRequest.현수막디자인 === `type${num}` ? itemStyles.selectedBanner : ''}`}>
                                    <input type="radio" name="modal_banner" value={`type${num}`} checked={currentRequest.현수막디자인 === `type${num}`} onChange={() => handleBannerTypeChange(`type${num}`)} hidden />
                                    <img src={`https://fs.qmk.me/template-banner-${num}-202601.webp`} alt={`디자인 ${num}`} onError={(e) => e.target.src='https://placehold.co/600x150?text=Design'} loading="lazy" />
                                    <span>디자인 {num}</span>
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

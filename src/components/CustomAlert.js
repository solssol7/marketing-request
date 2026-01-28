// src/components/CustomAlert.js
import styles from './CustomAlert.module.css';

export default function CustomAlert({ isOpen, type, message, onConfirm, onClose }) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.body}>
                    <p>{message}</p>
                </div>
                <div className={styles.footer}>
                    {type === 'confirm' ? (
                        <>
                            <button className={styles.cancelBtn} onClick={onClose}>취소</button>
                            <button className={styles.confirmBtn} onClick={onConfirm}>확인</button>
                        </>
                    ) : (
                        <button className={styles.okBtn} onClick={onClose}>확인</button>
                    )}
                </div>
            </div>
        </div>
    );
}

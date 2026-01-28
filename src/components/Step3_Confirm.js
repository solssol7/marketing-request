// src/components/Step3_Confirm.js
import styles from '../app/page.module.css';

export default function Step3_Confirm({
    requester,
    selectedMart,
    currentRequest,
    minDate,
    dueDate,
    setDueDate,
    onPrev,
    onSubmit,
    loading
}) {
    return (
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
                <input 
                    type="date" 
                    className={styles.input} 
                    min={minDate} 
                    value={dueDate} 
                    onChange={(e) => setDueDate(e.target.value)} 
                    required 
                />
            </div>

            <div className={styles.btnGroup}>
                <button className={styles.prevBtn} onClick={onPrev}>← 품목 수정</button>
                <button className={styles.submitBtn} onClick={onSubmit} disabled={loading}>
                    {loading ? '신청 중...' : '신청하기'}
                </button>
            </div>
        </div>
    );
}

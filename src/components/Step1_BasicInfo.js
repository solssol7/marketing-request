// src/components/Step1_BasicInfo.js
import styles from '../app/page.module.css';

export default function Step1_BasicInfo({ 
    users, 
    requester, 
    setRequester, 
    martSearch, 
    setMartSearch, 
    marts, 
    selectedMart, 
    onSelectMart, 
    onNext 
}) {
    // 마트 검색 필터
    const filteredMarts = marts.filter(m => 
        m.name.toLowerCase().includes(martSearch.toLowerCase())
    );

    return (
        <div className={styles.stepContent}>
            <h2 className={styles.title}> 어떤 마트의 유인물을 요청하시나요?</h2>
            
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
                                    onClick={() => onSelectMart(mart)}
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

            <button className={styles.nextBtn} onClick={onNext}>다음 단계로 →</button>
        </div>
    );
}

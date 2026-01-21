'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function Home() {
    const [users, setUsers] = useState([]);
    const [marts, setMarts] = useState([]);
    const [activeTab, setActiveTab] = useState('tab1');
    const [loading, setLoading] = useState(false);
    const [minDate, setMinDate] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        요청자: '',
        마트명: '', // Stores Mart ID
        마감기한: '',
        실내용X배너개수: 0,
        실외용X배너개수: 0,
        x배너디자인: [], // Checkbox Array
        현수막가로: '',
        현수막세로: '',
        현수막디자인: '',
        전단지가로: '',
        전단지세로: '',
        전단지디자인: '',
        기타: '',
        디자인사이즈: '',
        디자인용도: ''
    });

    // Initial Data Loading & Hydration Fix
    useEffect(() => {
        setMinDate(new Date().toISOString().split('T')[0]);

        fetch('/api/init')
            .then(res => res.json())
            .then(data => {
                setUsers(data.users || []);
                setMarts(data.marts || []);
            })
            .catch(err => console.error('Failed to load init data:', err));
    }, []);

    // Input Handler
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // X-Banner Checkbox Handler
    const handleCheckboxChange = (val) => {
        let newDesign = [...formData.x배너디자인];
        if (val === 'none') {
            newDesign = newDesign.includes('none') ? [] : ['none'];
        } else {
            if (newDesign.includes('none')) newDesign = []; // Uncheck 'none' if specific design selected
            if (newDesign.includes(val)) {
                newDesign = newDesign.filter(item => item !== val);
            } else {
                newDesign.push(val);
            }
        }
        setFormData(prev => ({ ...prev, x배너디자인: newDesign }));
    };

    // Submit Handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.요청자 || !formData.마트명 || !formData.마감기한) {
            alert('요청자, 마트명, 마감기한은 필수입니다.');
            return;
        }

        // formData.마트명 now holds the Name string (from input)
        // We need to look up the ID from the marts array based on the name.
        // User noted duplicates might exist, but we just need a best-effort ID or just pass what we have.
        // Logic: Try to find a mart with the same name.
        const selectedMart = marts.find(m => m.name === formData.마트명);
        const payload = {
            ...formData,
            마트Id: selectedMart ? selectedMart.id : 'Unknown', // Use found ID or default
            마트명: formData.마트명 // The name is already in formData
        };

        setLoading(true);
        try {
            const res = await fetch('/api/submit', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (res.ok) {
                alert('요청이 완료되었습니다.');
                window.location.reload();
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (err) {
            alert('오류 발생: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const tabNames = ['X배너', '현수막', '전단지', '기타', '디자인요청', '구글드라이브'];

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit} className={styles.formCard}>
                <h2 className={styles.title}>마케팅을 요청하세요.</h2>

                <div className={styles.formRow}>
                    <label className={styles.largeInputLabel}>요청자 :
                        <input
                            list="users-list"
                            name="요청자"
                            value={formData.요청자}
                            onChange={handleChange}
                            placeholder="이름 선택"
                            required
                        />
                        <datalist id="users-list">
                            {users.map((u, i) => <option key={u || i} value={u} />)}
                        </datalist>
                    </label>
                </div>
                <div className={styles.formRow}>
                    <label className={styles.largeInputLabel}>마트명 :
                        <input
                            list="marts-list"
                            name="마트명"
                            value={formData.마트명}
                            onChange={handleChange}
                            placeholder="마트 선택"
                            required
                        />
                        <datalist id="marts-list">
                            {marts.map((m, i) => <option key={m.id || i} value={m.name} />)}
                        </datalist>
                    </label>
                </div>
                <div className={styles.formRow}>
                    <label className={styles.largeInputLabel}>마감기한 :
                        <input type="date" name="마감기한" min={minDate} onChange={handleChange} required />
                    </label>
                </div>

                <div className={styles.tabs}>
                    {['tab1', 'tab2', 'tab3', 'tab4', 'tab5', 'tab6'].map((tab, idx) => (
                        <div key={tab}
                            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab)}>
                            {tabNames[idx]}
                        </div>
                    ))}
                </div>

                {/* Tab 1: X-Banner */}
                <div className={`${styles.tabContent} ${activeTab === 'tab1' ? styles.activeContent : ''}`}>
                    <div className={styles.group}>
                        <div className={styles.formRow}>
                            <label>실내용 개수: <input type="number" name="실내용X배너개수" onChange={handleChange} /></label>
                            <label>실외용 개수: <input type="number" name="실외용X배너개수" onChange={handleChange} /></label>
                        </div>
                        <div className={styles.xBannerImages}>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                <label key={num} className={formData.x배너디자인.includes(`type${num}`) ? styles.selectedImg : ''}>
                                    <img
                                        src={`https://fs.qmk.me/template-xbanner-${num}.png`}
                                        onClick={() => handleCheckboxChange(`type${num}`)}
                                        alt={`${num}번 디자인`}
                                    />
                                    <span>{num}번</span>
                                </label>
                            ))}
                        </div>
                        <label className={styles.selectNoneLabel}>
                            <input type="checkbox"
                                checked={formData.x배너디자인.includes('none')}
                                onChange={() => handleCheckboxChange('none')} />
                            <span className={formData.x배너디자인.includes('none') ? styles.selected : ''}>선택 안함 (디자인 없음)</span>
                        </label>
                    </div>
                </div>

                {/* Tab 2: Banner */}
                <div className={`${styles.tabContent} ${activeTab === 'tab2' ? styles.activeContent : ''}`}>
                    <div className={styles.group}>
                        <div className={styles.formRow}>
                            <label>가로(cm): <input type="number" name="현수막가로" onChange={handleChange} /></label>
                            <label>세로(cm): <input type="number" name="현수막세로" onChange={handleChange} /></label>
                        </div>
                        <div className={styles.longBannerImages}>
                            <label><input type="radio" name="현수막디자인" value="type1" onChange={handleChange} /> 디자인 1</label>
                            <label><input type="radio" name="현수막디자인" value="type2" onChange={handleChange} /> 디자인 2</label>
                        </div>
                    </div>
                </div>

                {/* Tab 3: Flyer */}
                <div className={`${styles.tabContent} ${activeTab === 'tab3' ? styles.activeContent : ''}`}>
                    <div className={styles.group}>
                        <label>가로: <input type="number" name="전단지가로" onChange={handleChange} /></label>
                        <label>세로: <input type="number" name="전단지세로" onChange={handleChange} /></label>
                        <label>내용: <textarea name="전단지디자인" onChange={handleChange}></textarea></label>
                    </div>
                </div>

                {/* Tab 4: Etc */}
                <div className={`${styles.tabContent} ${activeTab === 'tab4' ? styles.activeContent : ''}`}>
                    <div className={styles.group}>
                        <textarea name="기타" onChange={handleChange} placeholder="요청내용 입력"></textarea>
                    </div>
                </div>

                {/* Tab 5: Design Request */}
                <div className={`${styles.tabContent} ${activeTab === 'tab5' ? styles.activeContent : ''}`}>
                    <div className={styles.group}>
                        <label>사이즈: <input type="text" name="디자인사이즈" onChange={handleChange} /></label>
                        <label>용도: <input type="text" name="디자인용도" onChange={handleChange} /></label>
                    </div>
                </div>

                {/* Tab 6: Google Drive */}
                <div className={`${styles.tabContent} ${activeTab === 'tab6' ? styles.activeContent : ''}`}>
                    <div className={styles.group}>
                        <h3>구글 드라이브 링크</h3>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
                            필요한 자료나 시안을 구글 드라이브에서 확인하세요.
                        </p>
                        <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
                            <li>
                                <a href="https://drive.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#ff6a21', textDecoration: 'none', fontWeight: 'bold' }}>
                                    📂 공용 문서함 바로가기
                                </a>
                            </li>
                            <li>
                                <a href="https://drive.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#ff6a21', textDecoration: 'none', fontWeight: 'bold' }}>
                                    🎨 디자인 리소스 바로가기
                                </a>
                            </li>
                        </ul>

                        <div style={{ marginTop: '24px', textAlign: 'center' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>QR 코드 다운로드</p>
                            <img src="/qrcode.png" alt="QR Code" style={{ maxWidth: '150px', border: '1px solid #ddd', padding: '8px', borderRadius: '8px' }} />
                            <br />
                            <a href="/qrcode.png" download="qrcode.png" style={{
                                display: 'inline-block',
                                marginTop: '12px',
                                padding: '8px 16px',
                                backgroundColor: '#333',
                                color: '#fff',
                                textDecoration: 'none',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}>
                                ⬇️ 이미지 다운로드
                            </a>
                        </div>
                    </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? '요청 중...' : '요청하기'}
                </button>

                {loading && <div className={styles.overlay}>처리 중입니다...</div>}
            </form>
        </div>
    );
}
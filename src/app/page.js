// src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

// 분리한 컴포넌트 불러오기
import Step1_BasicInfo from '../components/Step1_BasicInfo';
import Step2_Items from '../components/Step2_Items';
import Step3_Confirm from '../components/Step3_Confirm';
import DesignModal from '../components/DesignModal';

export default function Home() {
    // --- 데이터 상태 ---
    const [users, setUsers] = useState([]);
    const [marts, setMarts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [minDate, setMinDate] = useState('');

    // --- UI 상태 ---
    const [step, setStep] = useState(1);
    const [activeTab, setActiveTab] = useState('tab1');
    const [showDesignModal, setShowDesignModal] = useState(false);
    const [designModalType, setDesignModalType] = useState('');

    // --- 입력 상태 ---
    const [requester, setRequester] = useState('');
    const [martSearch, setMartSearch] = useState('');
    const [selectedMart, setSelectedMart] = useState(null);
    const [dueDate, setDueDate] = useState('');
    
    // 요청 품목 상태
    const initialRequest = {
        실내용X배너개수: 0, 실외용X배너개수: 0, x배너디자인: [],
        현수막가로: '', 현수막세로: '', 현수막디자인: '',
        전단지가로: '', 전단지세로: '', 전단지디자인: '',
        기타: '', 디자인사이즈: '', 디자인용도: ''
    };
    const [currentRequest, setCurrentRequest] = useState(initialRequest);

    // 초기 데이터 로드
    useEffect(() => {
        setMinDate(new Date().toISOString().split('T')[0]);
        async function fetchData() {
            try {
                const res = await fetch('/api/init');
                const contentType = res.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) throw new Error("JSON 아님");
                const data = await res.json();
                if (data.success) {
                    setUsers(data.users || []);
                    setMarts(data.marts || []);
                }
            } catch (err) { console.error('Load Fail:', err); }
        }
        fetchData();
    }, []);

    // 핸들러 함수들
    const handleMartSelect = (mart) => {
        if (!mart.orderable) {
            if (!confirm('현재 [주문 불가] 상태입니다.\n계속 신청하시겠습니까?')) return;
        }
        setSelectedMart(mart);
    };

    const handleNumberChange = (e, field) => {
        let val = e.target.value;
        if (val !== '' && Number(val) < 0) val = 0;
        setCurrentRequest(prev => ({ ...prev, [field]: val }));
    };

    const handleTextChange = (e, field) => {
        setCurrentRequest(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleXBannerCheck = (val) => {
        let newDesign = [...currentRequest.x배너디자인];
        if (val === 'none') newDesign = newDesign.includes('none') ? [] : ['none'];
        else {
            if (newDesign.includes('none')) newDesign = [];
            if (newDesign.includes(val)) newDesign = newDesign.filter(item => item !== val);
            else newDesign.push(val);
        }
        setCurrentRequest(prev => ({ ...prev, x배너디자인: newDesign }));
    };

    const handleBannerTypeChange = (val) => {
        setCurrentRequest(prev => ({ ...prev, 현수막디자인: val }));
    };

    const handleStepClick = (targetStep) => {
        if (targetStep < step) setStep(targetStep);
        else if (targetStep > step) {
            if (step === 1 && targetStep === 2) {
                if (!requester || !selectedMart) return alert('요청자와 마트를 선택해주세요.');
                setStep(2);
            }
        }
    };

    const goNext = () => {
        if (step === 1) {
            if (!requester) return alert('요청자를 선택해주세요.');
            if (!selectedMart) return alert('마트를 선택해주세요.');
        }
        if (step === 2) {
            const xCount = Number(currentRequest.실내용X배너개수 || 0) + Number(currentRequest.실외용X배너개수 || 0);
            if (xCount > 0 && currentRequest.x배너디자인.length === 0) return alert('X배너 디자인을 선택해주세요.');
            if ((currentRequest.현수막가로 || currentRequest.현수막세로) && !currentRequest.현수막디자인) return alert('현수막 디자인을 선택해주세요.');
        }
        setStep(prev => prev + 1);
    };

    const handleSubmit = async () => {
        if (!dueDate) return alert('마감기한을 입력해주세요.');
        if (!confirm('신청하시겠습니까?')) return;
        setLoading(true);
        try {
            const payload = {
                요청자: requester,
                마트명: selectedMart.name,
                마트Id: selectedMart.id,
                마감기한: dueDate,
                ...currentRequest
            };
            const res = await fetch('/api/submit', { method: 'POST', body: JSON.stringify(payload) });
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) throw new Error("서버 에러");
            const result = await res.json();
            if (result.success) {
                alert('완료되었습니다.');
                window.location.reload();
            } else throw new Error(result.error);
        } catch (err) { alert('오류: ' + err.message); } 
        finally { setLoading(false); }
    };

    return (
        <div className={styles.container}>
            {/* 상단 네비게이션 */}
            <div className={styles.progressBar}>
                {[1, 2, 3].map(s => (
                    <div 
                        key={s}
                        className={`${styles.stepItem} ${step >= s ? styles.activeStep : ''} ${styles.clickableStep}`}
                        onClick={() => handleStepClick(s)}
                    >
                        {s}. {s===1?'기본정보':s===2?'품목선택':'신청완료'}
                    </div>
                ))}
            </div>

            <div className={styles.card}>
                {step === 1 && (
                    <Step1_BasicInfo 
                        users={users} requester={requester} setRequester={setRequester}
                        martSearch={martSearch} setMartSearch={setMartSearch}
                        marts={marts} selectedMart={selectedMart}
                        onSelectMart={handleMartSelect} onNext={goNext}
                    />
                )}
                
                {step === 2 && (
                    <Step2_Items 
                        selectedMart={selectedMart} activeTab={activeTab} setActiveTab={setActiveTab}
                        currentRequest={currentRequest} 
                        handleNumberChange={handleNumberChange} handleTextChange={handleTextChange}
                        handleXBannerCheck={handleXBannerCheck} handleBannerTypeChange={handleBannerTypeChange}
                        openModal={(type) => { setDesignModalType(type); setShowDesignModal(true); }}
                        onPrev={() => setStep(1)} onNext={goNext}
                    />
                )}

                {step === 3 && (
                    <Step3_Confirm 
                        requester={requester} selectedMart={selectedMart} currentRequest={currentRequest}
                        minDate={minDate} dueDate={dueDate} setDueDate={setDueDate}
                        onPrev={() => setStep(2)} onSubmit={handleSubmit} loading={loading}
                    />
                )}
            </div>

            <DesignModal 
                isOpen={showDesignModal} onClose={() => setShowDesignModal(false)}
                type={designModalType} currentRequest={currentRequest}
                handleXBannerCheck={handleXBannerCheck} handleBannerTypeChange={handleBannerTypeChange}
            />
        </div>
    );
}

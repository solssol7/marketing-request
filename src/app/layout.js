import './globals.css';

export const metadata = {
    title: '마케팅 요청',
    description: '마케팅 디자인 요청 양식입니다.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="ko">
            <body>
                {children}
            </body>
        </html>
    );
}
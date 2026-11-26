import { CONTACT_URL } from '@/lib/constants'
import { LegalLayout } from './LegalLayout'

export default function PrivacyPage() {
  return (
    <LegalLayout title="개인정보처리방침" updated="2026년 11월 26일">
      <p>찰칵셰프는 회원가입 없이 쓰는 서비스예요. 꼭 필요한 정보만 잠깐 쓰고, 이름·연락처 같은 개인정보는 받지 않아요.</p>

      <h2>1. 이 기기에만 저장되는 정보</h2>
      <ul>
        <li>찜한 레시피, 최근 본 레시피, 만든 요리 기록</li>
        <li>기본 양념, 싫어하는 재료, 닉네임, 화면 테마 같은 설정</li>
      </ul>
      <p>이 정보는 브라우저 저장소(localStorage)에만 있고 서버로 보내지 않아요. 브라우저 데이터를 지우면 함께 사라져요.</p>

      <h2>2. 사진 인식에 쓰는 정보</h2>
      <ul>
        <li>올린 사진은 재료를 찾기 위해 서버를 거쳐 Google Gemini API로 보내요.</li>
        <li>찰칵셰프 서버는 사진을 저장하지 않아요. 인식이 끝나면 바로 버려요.</li>
        <li>Gemini 무료 등급을 쓰고 있어서, Google이 서비스 개선을 위해 입력 내용을 활용할 수 있어요. 사람 얼굴이나 개인 물건이 찍히지 않게 재료만 찍어 주세요.</li>
      </ul>

      <h2>3. 남용 방지를 위한 기록</h2>
      <p>사진 인식 횟수를 하루 단위로 제한하려고 접속 IP를 되돌릴 수 없는 해시값으로 바꿔 날짜·횟수와 함께 저장해요. IP 원문은 저장하지 않아요.</p>

      <h2>4. 문의</h2>
      <p>
        궁금한 점은{' '}
        <a href={CONTACT_URL} target="_blank" rel="noreferrer" className="text-primary-text underline underline-offset-2">
          GitHub 이슈
        </a>
        로 남겨 주세요.
      </p>
    </LegalLayout>
  )
}

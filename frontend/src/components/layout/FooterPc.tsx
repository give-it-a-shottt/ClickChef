import { Link } from 'react-router'
import { Logo } from '@/components/Logo'
import { CONTACT_URL } from '@/lib/constants'

/** 피그마 Footer PC — 데이터 출처 표기(공공데이터 이용 조건) 포함 */
export function FooterPc() {
  return (
    <footer className="bg-bg-light">
      <div className="mx-auto flex max-w-content flex-col gap-4 pt-12 pb-14">
        <div className="flex items-center">
          <Logo height={28} />
          <span className="flex-1" />
          <nav aria-label="정보" className="flex gap-6 text-body-m-13 text-text-sub">
            <Link to="/terms" className="hover:text-text-main">
              이용약관
            </Link>
            <Link to="/privacy" className="text-label-13 hover:text-text-main">
              개인정보처리방침
            </Link>
            <a href={CONTACT_URL} target="_blank" rel="noreferrer" className="hover:text-text-main">
              문의하기
            </a>
          </nav>
        </div>
        <p className="text-caption-12 text-text-sub-weak">
          레시피 데이터: 식품의약품안전처 조리식품 레시피 DB · AI 추천 결과는 참고용이에요. 알레르기 재료는 꼭 직접 확인해 주세요.
        </p>
        <p className="text-caption-12 text-text-sub-weak">© 2026 찰칵셰프</p>
      </div>
    </footer>
  )
}

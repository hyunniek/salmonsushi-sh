/**
 * 이마트 센트럴점 간편식 프로모션 웹사이트 - Pure Vanilla JavaScript Logic
 * Zero-Dependency / Standalone Execution
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Global Application State ---
  const state = {
    // 상품 가격 및 장바구니
    prices: {
      saladWrap: 6200,   // 훈제오리 샐러드랩
      beefRice: 5900,    // 한끼 소불고기덮밥
      chickenRice: 5500  // 매콤 닭갈비볶음밥
    },
    names: {
      saladWrap: '훈제오리 샐러드랩',
      beefRice: '한끼 소불고기덮밥',
      chickenRice: '매콤 닭갈비볶음밥'
    },
    cart: {
      saladWrap: 1,
      beefRice: 1,
      chickenRice: 0
    },
    // 타임어택 & 잔여 수량 (최대 20세트)
    timeAttack: {
      maxSets: 20,
      currentSets: 20
    },
    // 카드뉴스 슬라이더 (0 ~ 5)
    carousel: {
      currentIndex: 0,
      totalSlides: 6,
      touchStartX: 0,
      touchEndX: 0
    }
  };

  // --- 2. Initialize All Modules ---
  initTimeAttack();
  initCalculator();
  initCarousel();
  initModal();
  initAccordion();
  initShareActions();

  // --- 3. Module: Time Attack & Live Stock ---
  function initTimeAttack() {
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const statusTextEl = document.getElementById('timer-status-text');
    const currentStockEl = document.getElementById('current-stock-val');
    const progressBarEl = document.getElementById('stock-progress-bar');
    const stockCaptionEl = document.getElementById('stock-caption-text');

    function updateTimer() {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();

      // 목표 타임어택 시간: 매일 12:00:00
      let targetTime = new Date(now);
      targetTime.setHours(12, 0, 0, 0);

      let diffMs = 0;
      let isLiveNow = false;
      let isExpiredToday = false;

      if (currentHours < 12) {
        // 아직 12시 이전: 오픈 카운트다운
        diffMs = targetTime - now;
        statusTextEl.innerHTML = '<i class="fa-solid fa-clock"></i> 점심 12:00 선착순 오픈까지 남은 시간';
        state.timeAttack.currentSets = 20;
      } else if (currentHours >= 12 && currentHours < 14) {
        // 12:00 ~ 14:00: 타임어택 실시간 진행 중!
        isLiveNow = true;
        const endTime = new Date(now);
        endTime.setHours(14, 0, 0, 0);
        diffMs = endTime - now;
        statusTextEl.innerHTML = '<span class="live-pill" style="margin-right:6px;"><span class="live-dot"></span> 진행중</span> 오늘 타임어택 마감까지 남은 시간';
        
        // 시간 경과에 따른 잔여 세트 실시간 시뮬레이션 (120분 동안 20세트 서서히 차감)
        const elapsedMinutes = (currentHours - 12) * 60 + currentMinutes;
        const remaining = Math.max(2, Math.round(20 - (elapsedMinutes / 120) * 18));
        state.timeAttack.currentSets = remaining;
      } else {
        // 14시 이후: 오늘 행사 종료, 내일 12:00 오픈 카운트다운
        isExpiredToday = true;
        targetTime.setDate(targetTime.getDate() + 1);
        diffMs = targetTime - now;
        statusTextEl.innerHTML = '<i class="fa-solid fa-bell"></i> 내일 점심 12:00 선착순 오픈까지';
        state.timeAttack.currentSets = 0;
      }

      // 시/분/초 포맷팅
      const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      hoursEl.textContent = String(h).padStart(2, '0');
      minutesEl.textContent = String(m).padStart(2, '0');
      secondsEl.textContent = String(s).padStart(2, '0');

      // 잔여 수량 UI 갱신
      currentStockEl.textContent = state.timeAttack.currentSets;
      const percent = (state.timeAttack.currentSets / state.timeAttack.maxSets) * 100;
      progressBarEl.style.width = `${percent}%`;

      if (isLiveNow) {
        stockCaptionEl.innerHTML = `<i class="fa-solid fa-fire text-red"></i> <strong>현재 실시간 판매 중!</strong> 남은 수량이 빠르게 소진되고 있습니다.`;
      } else if (isExpiredToday) {
        stockCaptionEl.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#10B981;"></i> 오늘 준비된 선착순 20세트가 완판되었습니다. 내일 12:00에 다시 만나요!`;
      } else {
        stockCaptionEl.innerHTML = `<i class="fa-solid fa-circle-info"></i> 점심 12:00 정각 센트럴점 냉장 매대 골든존으로 방문해주세요!`;
      }
    }

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  // --- 4. Module: DIY Calculator ---
  function initCalculator() {
    const qtySaladWrapEl = document.getElementById('qty-saladWrap');
    const qtyBeefRiceEl = document.getElementById('qty-beefRice');
    const qtyChickenRiceEl = document.getElementById('qty-chickenRice');

    const totalCountValEl = document.getElementById('total-count-val');
    const originalTotalValEl = document.getElementById('original-total-val');
    const discountAmountValEl = document.getElementById('discount-amount-val');
    const finalTotalValEl = document.getElementById('final-total-val');
    const perMealValEl = document.getElementById('per-meal-val');
    const discountBadgeBubble = document.getElementById('discount-badge-bubble');
    const statusMsgTextEl = document.getElementById('status-msg-text');
    const mascotSpeechEl = document.getElementById('mascot-speech');
    const selectedItemsSummaryEl = document.getElementById('selected-items-summary');
    const btnResetCart = document.getElementById('btn-reset-cart');
    const presetButtons = document.getElementById('preset-buttons');

    // 플로팅 바 요소
    const floatingCountEl = document.getElementById('floating-count');
    const floatingPriceEl = document.getElementById('floating-price');

    // 수량 증감 버튼 이벤트 위임
    const productListEl = document.getElementById('product-selection-list');
    productListEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-qty');
      if (!btn) return;

      const action = btn.dataset.action;
      const target = btn.dataset.target;

      if (action === 'increase') {
        state.cart[target] = (state.cart[target] || 0) + 1;
      } else if (action === 'decrease') {
        state.cart[target] = Math.max(0, (state.cart[target] || 0) - 1);
      }

      // 프리셋 활성 해제
      document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
      renderCalculator();
    });

    // 추천 프리셋 버튼 클릭 이벤트
    presetButtons.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-preset');
      if (!btn) return;

      document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const preset = btn.dataset.preset;
      if (preset === 'balance') {
        // 영양균형형: 샐러드랩 1 + 소불고기 1
        state.cart = { saladWrap: 1, beefRice: 1, chickenRice: 0 };
        showToast('🥗🍱 영양균형형 (샐러드랩 + 불고기덮밥) 세트가 적용되었습니다!');
      } else if (preset === 'cost-effective') {
        // 가성비균형형: 샐러드랩 1 + 닭갈비 1
        state.cart = { saladWrap: 1, beefRice: 0, chickenRice: 1 };
        showToast('🥗🌶️ 가성비균형형 (샐러드랩 + 닭갈비볶음밥) 세트가 적용되었습니다!');
      } else if (preset === 'hearty') {
        // 든든형: 소불고기 1 + 닭갈비 1
        state.cart = { saladWrap: 0, beefRice: 1, chickenRice: 1 };
        showToast('🍱🍚 든든형 (덮밥 + 볶음밥) 세트가 적용되었습니다!');
      } else if (preset === 'light') {
        // 가벼운형: 샐러드랩 2
        state.cart = { saladWrap: 2, beefRice: 0, chickenRice: 0 };
        showToast('🥗🥗 가벼운형 (샐러드랩 2개) 세트가 적용되었습니다!');
      }

      renderCalculator();
    });

    // 장바구니 초기화 버튼
    btnResetCart.addEventListener('click', () => {
      state.cart = { saladWrap: 0, beefRice: 0, chickenRice: 0 };
      document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
      renderCalculator();
      showToast('장바구니를 초기화했습니다.');
    });

    // 메인 계산 렌더러 함수
    function renderCalculator() {
      // 1. 수량 DOM 갱신
      qtySaladWrapEl.textContent = state.cart.saladWrap;
      qtyBeefRiceEl.textContent = state.cart.beefRice;
      qtyChickenRiceEl.textContent = state.cart.chickenRice;

      // 2. 카드 강조 클래스 토글
      document.querySelectorAll('.product-card').forEach(card => {
        const prod = card.dataset.product;
        if (state.cart[prod] > 0) {
          card.classList.add('selected');
        } else {
          card.classList.remove('selected');
        }
      });

      // 3. 금액 계산
      const totalCount = state.cart.saladWrap + state.cart.beefRice + state.cart.chickenRice;
      const originalTotal = (state.cart.saladWrap * state.prices.saladWrap) +
                            (state.cart.beefRice * state.prices.beefRice) +
                            (state.cart.chickenRice * state.prices.chickenRice);

      const isDiscountEligible = totalCount >= 2;
      const discountRate = isDiscountEligible ? 0.20 : 0.0;
      const discountAmount = Math.round(originalTotal * discountRate);
      const finalPrice = originalTotal - discountAmount;
      const perMealPrice = totalCount > 0 ? Math.round(finalPrice / totalCount) : 0;

      // 4. 수치 렌더링
      totalCountValEl.textContent = totalCount;
      originalTotalValEl.textContent = `${originalTotal.toLocaleString('ko-KR')}원`;
      discountAmountValEl.textContent = `-${discountAmount.toLocaleString('ko-KR')}원`;
      animateNumber(finalTotalValEl, finalPrice);
      perMealValEl.textContent = perMealPrice.toLocaleString('ko-KR');

      // 플로팅 바 갱신
      floatingCountEl.textContent = totalCount;
      floatingPriceEl.textContent = `${finalPrice.toLocaleString('ko-KR')}원`;

      // 5. 담긴 상품 요약 렌더링
      if (totalCount === 0) {
        selectedItemsSummaryEl.innerHTML = '<div class="empty-cart-msg">메뉴를 담아 나만의 조합을 만들어보세요!</div>';
      } else {
        let tagsHtml = '';
        if (state.cart.saladWrap > 0) tagsHtml += `<span class="cart-item-tag">🥗 샐러드랩 × ${state.cart.saladWrap}</span>`;
        if (state.cart.beefRice > 0) tagsHtml += `<span class="cart-item-tag">🍱 소불고기덮밥 × ${state.cart.beefRice}</span>`;
        if (state.cart.chickenRice > 0) tagsHtml += `<span class="cart-item-tag">🌶️ 닭갈비볶음밥 × ${state.cart.chickenRice}</span>`;
        selectedItemsSummaryEl.innerHTML = tagsHtml;
      }

      // 6. 상태 메시지 및 마스코트 말풍선 처리
      if (isDiscountEligible) {
        discountBadgeBubble.classList.add('show');
        statusMsgTextEl.className = 'status-msg success-msg';
        statusMsgTextEl.innerHTML = `<i class="fa-solid fa-gift"></i> <strong>20% 즉시 할인 적용 완료!</strong> 세트당 ${discountAmount.toLocaleString('ko-KR')}원 절약 (1끼 ${perMealPrice.toLocaleString('ko-KR')}원)`;
        mascotSpeechEl.textContent = '🎉 20% 파격 할인 적용 완료! 1끼 4천원대 실속 실현!';
      } else if (totalCount === 1) {
        discountBadgeBubble.classList.remove('show');
        statusMsgTextEl.className = 'status-msg info-msg';
        statusMsgTextEl.innerHTML = `<i class="fa-solid fa-circle-exclamation text-red"></i> <strong>1개만 더 담으시면</strong> 전체 금액의 20%가 즉시 할인됩니다!`;
        mascotSpeechEl.textContent = '하나 더 담으면 20% 즉시 할인 적용!';
      } else {
        discountBadgeBubble.classList.remove('show');
        statusMsgTextEl.className = 'status-msg info-msg';
        statusMsgTextEl.innerHTML = `<i class="fa-solid fa-circle-info"></i> 대상 상품을 2개 이상 담으시면 20% 할인이 자동 적용됩니다.`;
        mascotSpeechEl.textContent = '메뉴를 2개 이상 골라 담아보세요!';
      }
    }

    // 초기 렌더링 (영양균형형 기본 세팅)
    renderCalculator();
  }

  // --- 5. Pure JS CountUp Animation ---
  function animateNumber(element, targetValue) {
    const startValue = parseInt(element.textContent.replace(/[^0-9]/g, ''), 10) || 0;
    if (startValue === targetValue) {
      element.textContent = targetValue.toLocaleString('ko-KR');
      return;
    }

    const duration = 300; // ms
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (targetValue - startValue) * ease);
      element.textContent = current.toLocaleString('ko-KR');

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = targetValue.toLocaleString('ko-KR');
      }
    }

    requestAnimationFrame(step);
  }

  // --- 6. Module: Card News Carousel Slider ---
  function initCarousel() {
    const track = document.getElementById('carousel-track');
    const slides = document.querySelectorAll('.carousel-slide');
    const dotsContainer = document.getElementById('carousel-dots');
    const btnPrev = document.getElementById('btn-carousel-prev');
    const btnNext = document.getElementById('btn-carousel-next');

    function goToSlide(index) {
      if (index < 0) index = state.carousel.totalSlides - 1;
      if (index >= state.carousel.totalSlides) index = 0;

      state.carousel.currentIndex = index;
      track.style.transform = `translateX(-${index * 100}%)`;

      // Dots 업데이트
      const dots = dotsContainer.querySelectorAll('.dot');
      dots.forEach((dot, idx) => {
        if (idx === index) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }

    // 이전/다음 버튼 클릭
    btnPrev.addEventListener('click', () => {
      goToSlide(state.carousel.currentIndex - 1);
    });

    btnNext.addEventListener('click', () => {
      goToSlide(state.carousel.currentIndex + 1);
    });

    // 닷 클릭
    dotsContainer.addEventListener('click', (e) => {
      const dot = e.target.closest('.dot');
      if (!dot) return;
      const idx = parseInt(dot.dataset.index, 10);
      goToSlide(idx);
    });

    // 터치 스와이프 제스처 (모바일)
    const viewport = document.querySelector('.carousel-viewport');
    let startX = 0;
    let endX = 0;

    viewport.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    viewport.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      handleSwipe();
    }, { passive: true });

    // 마우스 드래그 스와이프 (PC)
    let isMouseDown = false;
    viewport.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      startX = e.clientX;
    });

    viewport.addEventListener('mouseup', (e) => {
      if (!isMouseDown) return;
      isMouseDown = false;
      endX = e.clientX;
      handleSwipe();
    });

    function handleSwipe() {
      const diffX = startX - endX;
      if (Math.abs(diffX) > 40) {
        if (diffX > 0) {
          goToSlide(state.carousel.currentIndex + 1);
        } else {
          goToSlide(state.carousel.currentIndex - 1);
        }
      }
    }

    // 키보드 좌우 화살표 지원
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        goToSlide(state.carousel.currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        goToSlide(state.carousel.currentIndex + 1);
      }
    });
  }

  // --- 7. Module: Lightbox Modal ---
  function initModal() {
    const modal = document.getElementById('poster-modal');
    const btnOpenHero = document.getElementById('btn-open-poster');
    const thumbTrigger = document.getElementById('poster-thumb-trigger');
    const btnViewLarge = document.getElementById('btn-view-large-poster');
    const btnClose = document.getElementById('btn-modal-close');
    const btnModalShare = document.getElementById('btn-modal-share');

    function openModal() {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    if (btnOpenHero) btnOpenHero.addEventListener('click', openModal);
    if (thumbTrigger) thumbTrigger.addEventListener('click', openModal);
    if (btnViewLarge) btnViewLarge.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);

    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // ESC 키 누를 시 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });

    // 모달 내 링크 공유
    if (btnModalShare) {
      btnModalShare.addEventListener('click', () => {
        copyPageUrl();
      });
    }
  }

  // --- 8. Module: FAQ Accordion ---
  function initAccordion() {
    const accordion = document.getElementById('faq-accordion');
    if (!accordion) return;

    accordion.addEventListener('click', (e) => {
      const header = e.target.closest('.accordion-header');
      if (!header) return;

      const item = header.closest('.accordion-item');
      const body = item.querySelector('.accordion-body');
      const isActive = item.classList.contains('active');

      // 다른 항목 닫기
      document.querySelectorAll('.accordion-item').forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          const otherBody = otherItem.querySelector('.accordion-body');
          if (otherBody) otherBody.style.maxHeight = null;
        }
      });

      // 현재 항목 토글
      if (isActive) {
        item.classList.remove('active');
        body.style.maxHeight = null;
      } else {
        item.classList.add('active');
        body.style.maxHeight = `${body.scrollHeight}px`;
      }
    });

    // 최초 활성 항목 높이 설정
    const initialActive = accordion.querySelector('.accordion-item.active .accordion-body');
    if (initialActive) {
      initialActive.style.maxHeight = `${initialActive.scrollHeight}px`;
    }
  }

  // --- 9. Module: Share & Toast Notifications ---
  function initShareActions() {
    const btnShareTop = document.getElementById('btn-share-top');
    const btnCopyLink = document.getElementById('btn-copy-link');

    if (btnShareTop) btnShareTop.addEventListener('click', copyPageUrl);
    if (btnCopyLink) btnCopyLink.addEventListener('click', copyPageUrl);
  }

  function copyPageUrl() {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => showToast('🔗 프로모션 링크가 클립보드에 복사되었습니다!'))
        .catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('🔗 프로모션 링크가 복사되었습니다!');
    } catch (err) {
      showToast('링크 복사에 실패했습니다. 브라우저 주소를 직접 복사해주세요.');
    }
    document.body.removeChild(textarea);
  }

  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-circle-check text-yellow"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 2600);
  }
});

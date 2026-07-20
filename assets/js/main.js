( () => {
	'use strict';

	const header = document.querySelector( '[data-site-header]' );
	const toggle = document.querySelector( '[data-menu-toggle]' );

	if ( ! header || ! toggle ) {
		return;
	}

	const closeMenu = () => {
		header.classList.remove( 'is-menu-open' );
		document.body.classList.remove( 'menu-open' );
		toggle.setAttribute( 'aria-expanded', 'false' );
	};

	const openMenu = () => {
		header.classList.add( 'is-menu-open' );
		document.body.classList.add( 'menu-open' );
		toggle.setAttribute( 'aria-expanded', 'true' );
	};

	header.classList.add( 'menu-ready' );

	toggle.addEventListener( 'click', () => {
		if ( header.classList.contains( 'is-menu-open' ) ) {
			closeMenu();
			return;
		}

		openMenu();
	} );

	header.addEventListener( 'click', ( event ) => {
		if ( event.target.closest( '.site-nav a' ) ) {
			closeMenu();
		}
	} );

	document.addEventListener( 'keydown', ( event ) => {
		if ( 'Escape' === event.key && header.classList.contains( 'is-menu-open' ) ) {
			closeMenu();
			toggle.focus();
		}
	} );

	window.addEventListener( 'resize', () => {
		if ( window.innerWidth > 1024 ) {
			closeMenu();
		}
	} );

	const worksSlider = document.querySelector( '[data-works-slider]' );

	if ( worksSlider ) {
		const track = worksSlider.querySelector( '[data-works-track]' );
		const prevButton = document.querySelector( '[data-works-prev]' );
		const nextButton = document.querySelector( '[data-works-next]' );
		const originalSlides = track ? Array.from( track.children ) : [];
		const lightboxItems = originalSlides
			.map( ( slide ) => slide.querySelector( '[data-works-lightbox-item]' ) )
			.filter( Boolean );
		const lightbox = document.querySelector( '[data-works-lightbox]' );
		const lightboxImage = lightbox?.querySelector( '[data-works-lightbox-image]' );
		const lightboxCounter = lightbox?.querySelector( '[data-works-lightbox-counter]' );
		const lightboxClose = lightbox?.querySelector( '[data-works-lightbox-close]' );
		const lightboxPrev = lightbox?.querySelector( '[data-works-lightbox-prev]' );
		const lightboxNext = lightbox?.querySelector( '[data-works-lightbox-next]' );
		const slideCount = originalSlides.length;
		const shouldReduceMotion = window.matchMedia( '(prefers-reduced-motion: reduce)' );
		let currentIndex = 0;
		let autoplayId = null;
		let lightboxIndex = 0;
		let lightboxTrigger = null;
		let touchStartX = null;

		if ( track && slideCount > 1 ) {
			originalSlides.forEach( ( slide ) => {
				const clone = slide.cloneNode( true );
				clone.setAttribute( 'aria-hidden', 'true' );
				clone.querySelectorAll( 'a, button, input, select, textarea, [tabindex]' ).forEach( ( element ) => {
					element.setAttribute( 'tabindex', '-1' );
				} );
				track.appendChild( clone );
			} );

			const getSlideStep = () => {
				const firstSlide = track.children[0];

				if ( ! firstSlide ) {
					return 0;
				}

				const trackStyles = window.getComputedStyle( track );
				const gap = Number.parseFloat( trackStyles.columnGap || trackStyles.gap ) || 0;

				return firstSlide.getBoundingClientRect().width + gap;
			};

			const setTrackPosition = ( animate = true ) => {
				track.style.transitionDuration = animate ? '' : '0ms';
				track.style.transform = `translate3d(${ -1 * currentIndex * getSlideStep() }px, 0, 0)`;
			};

			const normalizeLoopPosition = () => {
				if ( currentIndex >= slideCount ) {
					currentIndex = 0;
					setTrackPosition( false );
				}
			};

			const moveSlider = ( direction ) => {
				if ( direction < 0 && 0 === currentIndex ) {
					currentIndex = slideCount;
					setTrackPosition( false );

					window.requestAnimationFrame( () => {
						currentIndex = slideCount - 1;
						setTrackPosition( ! shouldReduceMotion.matches );
					} );

					return;
				}

				currentIndex += direction;

				window.requestAnimationFrame( () => {
					setTrackPosition( ! shouldReduceMotion.matches );

					if ( shouldReduceMotion.matches ) {
						normalizeLoopPosition();
					}
				} );
			};

			const stopAutoplay = () => {
				if ( autoplayId ) {
					window.clearInterval( autoplayId );
					autoplayId = null;
				}
			};

			const startAutoplay = () => {
				stopAutoplay();

				if ( shouldReduceMotion.matches || lightbox?.open ) {
					return;
				}

				autoplayId = window.setInterval( () => moveSlider( 1 ), 3800 );
			};

			const renderLightbox = () => {
				const item = lightboxItems[ lightboxIndex ];
				const sourceImage = item?.querySelector( 'img' );

				if ( ! item || ! sourceImage || ! lightboxImage || ! lightboxCounter ) {
					return;
				}

				lightboxImage.src = item.href;
				lightboxImage.alt = sourceImage.alt;
				lightboxCounter.textContent = `${ lightboxIndex + 1 } / ${ lightboxItems.length }`;
			};

			const moveLightbox = ( direction ) => {
				lightboxIndex = ( lightboxIndex + direction + lightboxItems.length ) % lightboxItems.length;
				renderLightbox();
			};

			const openLightbox = ( index, trigger ) => {
				if ( ! lightbox || ! lightboxItems.length ) {
					return;
				}

				lightboxIndex = ( index + lightboxItems.length ) % lightboxItems.length;
				lightboxTrigger = trigger;
				renderLightbox();
				stopAutoplay();
				document.body.classList.add( 'works-lightbox-open' );

				if ( 'function' === typeof lightbox.showModal ) {
					lightbox.showModal();
				} else {
					lightbox.setAttribute( 'open', '' );
				}

				lightboxClose?.focus();
			};

			const closeLightbox = () => {
				if ( ! lightbox?.open ) {
					return;
				}

				if ( 'function' === typeof lightbox.close ) {
					lightbox.close();
				} else {
					lightbox.removeAttribute( 'open' );
					lightbox.dispatchEvent( new Event( 'close' ) );
				}
			};

			track.addEventListener( 'click', ( event ) => {
				const item = event.target.closest( '[data-works-lightbox-item]' );

				if ( ! item ) {
					return;
				}

				event.preventDefault();
				openLightbox( Number.parseInt( item.dataset.worksIndex, 10 ) || 0, item );
			} );

			lightboxClose?.addEventListener( 'click', closeLightbox );
			lightboxPrev?.addEventListener( 'click', () => moveLightbox( -1 ) );
			lightboxNext?.addEventListener( 'click', () => moveLightbox( 1 ) );

			lightbox?.addEventListener( 'click', ( event ) => {
				if ( event.target === lightbox ) {
					closeLightbox();
				}
			} );

			lightbox?.addEventListener( 'close', () => {
				document.body.classList.remove( 'works-lightbox-open' );
				lightboxImage?.removeAttribute( 'src' );
				lightboxTrigger?.focus();
				lightboxTrigger = null;
				startAutoplay();
			} );

			lightbox?.addEventListener( 'keydown', ( event ) => {
				if ( 'ArrowLeft' === event.key ) {
					event.preventDefault();
					moveLightbox( -1 );
				} else if ( 'ArrowRight' === event.key ) {
					event.preventDefault();
					moveLightbox( 1 );
				}
			} );

			lightbox?.addEventListener( 'touchstart', ( event ) => {
				touchStartX = event.changedTouches[0]?.clientX ?? null;
			}, { passive: true } );

			lightbox?.addEventListener( 'touchend', ( event ) => {
				if ( null === touchStartX ) {
					return;
				}

				const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
				const distance = touchEndX - touchStartX;
				touchStartX = null;

				if ( Math.abs( distance ) >= 50 ) {
					moveLightbox( distance > 0 ? -1 : 1 );
				}
			}, { passive: true } );

			prevButton?.addEventListener( 'click', () => {
				moveSlider( -1 );
				startAutoplay();
			} );

			nextButton?.addEventListener( 'click', () => {
				moveSlider( 1 );
				startAutoplay();
			} );

			worksSlider.addEventListener( 'mouseenter', stopAutoplay );
			worksSlider.addEventListener( 'mouseleave', startAutoplay );
			worksSlider.addEventListener( 'focusin', stopAutoplay );
			worksSlider.addEventListener( 'focusout', startAutoplay );
			track.addEventListener( 'transitionend', normalizeLoopPosition );
			window.addEventListener( 'resize', () => setTrackPosition( false ) );

			shouldReduceMotion.addEventListener( 'change', () => {
				setTrackPosition( false );
				startAutoplay();
			} );

			setTrackPosition( false );
			startAutoplay();
		}
	}

	const reviewsSlider = document.querySelector( '[data-reviews-slider]' );

	if ( reviewsSlider ) {
		const reviewsTrack = reviewsSlider.querySelector( '[data-reviews-track]' );
		const reviewSlides = reviewsTrack ? Array.from( reviewsTrack.querySelectorAll( '[data-review-slide]' ) ) : [];
		const reviewsPrev = reviewsSlider.querySelector( '[data-reviews-prev]' );
		const reviewsNext = reviewsSlider.querySelector( '[data-reviews-next]' );
		const reviewsCounter = reviewsSlider.querySelector( '[data-reviews-counter]' );
		const reviewsReduceMotion = window.matchMedia( '(prefers-reduced-motion: reduce)' );
		let reviewIndex = 0;
		let reviewsScrollFrame = null;

		if ( reviewsTrack && reviewSlides.length ) {
			const getSlideOffset = ( slide ) => {
				const trackRect = reviewsTrack.getBoundingClientRect();
				const slideRect = slide.getBoundingClientRect();

				return slideRect.left - trackRect.left + reviewsTrack.scrollLeft;
			};

			const renderReviewsControls = () => {
				reviewsPrev?.toggleAttribute( 'disabled', 0 === reviewIndex );
				reviewsNext?.toggleAttribute( 'disabled', reviewSlides.length - 1 === reviewIndex );
				reviewSlides.forEach( ( slide, index ) => {
					slide.classList.toggle( 'is-active', index === reviewIndex );
				} );

				if ( reviewsCounter ) {
					reviewsCounter.textContent = `${ reviewIndex + 1 } / ${ reviewSlides.length }`;
				}
			};

			const moveToReview = ( nextIndex, animate = true ) => {
				reviewIndex = Math.min( Math.max( nextIndex, 0 ), reviewSlides.length - 1 );
				reviewsTrack.scrollTo( {
					left: getSlideOffset( reviewSlides[ reviewIndex ] ),
					behavior: animate && ! reviewsReduceMotion.matches ? 'smooth' : 'auto'
				} );
				renderReviewsControls();
			};

			const updateReviewFromScroll = () => {
				reviewsScrollFrame = null;
				const currentScroll = reviewsTrack.scrollLeft;
				let nearestIndex = 0;
				let nearestDistance = Number.POSITIVE_INFINITY;

				reviewSlides.forEach( ( slide, index ) => {
					const distance = Math.abs( getSlideOffset( slide ) - currentScroll );

					if ( distance < nearestDistance ) {
						nearestDistance = distance;
						nearestIndex = index;
					}
				} );

				if ( nearestIndex !== reviewIndex ) {
					reviewIndex = nearestIndex;
					renderReviewsControls();
				}
			};

			reviewsPrev?.addEventListener( 'click', () => moveToReview( reviewIndex - 1 ) );
			reviewsNext?.addEventListener( 'click', () => moveToReview( reviewIndex + 1 ) );

			reviewsTrack.addEventListener( 'keydown', ( event ) => {
				if ( 'ArrowLeft' === event.key ) {
					event.preventDefault();
					moveToReview( reviewIndex - 1 );
				} else if ( 'ArrowRight' === event.key ) {
					event.preventDefault();
					moveToReview( reviewIndex + 1 );
				}
			} );

			reviewsTrack.addEventListener( 'scroll', () => {
				if ( null !== reviewsScrollFrame ) {
					return;
				}

				reviewsScrollFrame = window.requestAnimationFrame( updateReviewFromScroll );
			}, { passive: true } );

			window.addEventListener( 'resize', () => moveToReview( reviewIndex, false ) );
			reviewsReduceMotion.addEventListener( 'change', () => moveToReview( reviewIndex, false ) );

			moveToReview( 0, false );
		}
	}

	// Reversible motion layer: subtle site choreography.
	// Remove this block and the matching block in main.css to roll it back.
	const motionPreference = window.matchMedia( '(prefers-reduced-motion: reduce)' );
	let revealObserver = null;
	const revealClassNames = [
		'motion-reveal',
		'motion-reveal--left',
		'motion-reveal--right',
		'motion-reveal--start',
		'motion-reveal--end',
		'motion-reveal--bottom',
		'is-revealed',
	];
	const revealGroups = [
		{
			direction: 'start',
			selector: '.services-section__visual, .why-section__content, .event-cta__photos, .about-section__header, .works-section__header, .packages-section__header, .offer-section__photo',
		},
		{
			direction: 'end',
			selector: '.services-section__content, .why-section__portrait, .event-cta__content, .about-section__photo, .offer-section__content',
		},
		{
			direction: 'bottom',
			selector: '.service-shortcuts, .about-columns--upper, .about-columns--lower, .works-slider, .packages-grid, .event-strip, .reviews-section > .container-wide',
		},
	];

	const clearRevealClasses = ( element ) => {
		element.classList.remove( ...revealClassNames );
	};

	const clearMotionLayer = () => {
		revealObserver?.disconnect();
		revealObserver = null;
		document.querySelectorAll( '.motion-reveal, .is-revealed' ).forEach( clearRevealClasses );
		document.documentElement.classList.remove( 'motion-enabled' );
	};

	const startMotionLayer = () => {
		if ( motionPreference.matches || revealObserver ) {
			return;
		}

		const revealElements = [];

		revealGroups.forEach( ( group ) => {
			document.querySelectorAll( group.selector ).forEach( ( element ) => {
				const bounds = element.getBoundingClientRect();
				const isAlreadyVisible = bounds.bottom > 0 && bounds.top < window.innerHeight;

				if ( isAlreadyVisible ) {
					return;
				}

				element.classList.add( 'motion-reveal', `motion-reveal--${ group.direction }` );
				revealElements.push( element );
			} );
		} );

		document.documentElement.classList.add( 'motion-enabled' );

		if ( !( 'IntersectionObserver' in window ) ) {
			revealElements.forEach( clearRevealClasses );
			return;
		}

		revealObserver = new IntersectionObserver( ( entries ) => {
			entries.forEach( ( entry ) => {
				if ( ! entry.isIntersecting ) {
					return;
				}

				const element = entry.target;
				revealObserver.unobserve( element );
				element.classList.add( 'is-revealed' );

				window.setTimeout( () => {
					clearRevealClasses( element );
				}, 1200 );
			} );
		}, { threshold: 0.35, rootMargin: '0px' } );

		window.requestAnimationFrame( () => {
			revealElements.forEach( ( element ) => revealObserver?.observe( element ) );
		} );
	};

	startMotionLayer();

	motionPreference.addEventListener( 'change', ( event ) => {
		if ( event.matches ) {
			clearMotionLayer();
			return;
		}

		startMotionLayer();
	} );

	const serviceTriggers = Array.from( document.querySelectorAll( '[data-service-popup]' ) );
	const serviceDialogs = Array.from( document.querySelectorAll( '[data-service-dialog]' ) );
	let servicePopupTrigger = null;

	const closeServicePopup = ( dialog ) => {
		if ( ! dialog?.open ) {
			return;
		}

		if ( 'function' === typeof dialog.close ) {
			dialog.close();
		} else {
			dialog.removeAttribute( 'open' );
			dialog.dispatchEvent( new Event( 'close' ) );
		}
	};

	const openServicePopup = ( dialog, trigger ) => {
		if ( ! dialog ) {
			return;
		}

		servicePopupTrigger = trigger;
		document.body.classList.add( 'service-popup-open' );

		if ( 'function' === typeof dialog.showModal ) {
			dialog.showModal();
		} else {
			dialog.setAttribute( 'open', '' );
		}

		dialog.querySelector( '[data-service-popup-close]' )?.focus();
	};

	serviceTriggers.forEach( ( trigger ) => {
		trigger.addEventListener( 'click', () => {
			const dialog = document.getElementById( `service-popup-${ trigger.dataset.servicePopup }` );
			openServicePopup( dialog, trigger );
		} );
	} );

	serviceDialogs.forEach( ( dialog ) => {
		dialog.querySelectorAll( '[data-service-popup-close]' ).forEach( ( closeButton ) => {
			closeButton.addEventListener( 'click', () => closeServicePopup( dialog ) );
		} );

		dialog.addEventListener( 'click', ( event ) => {
			if ( event.target === dialog ) {
				closeServicePopup( dialog );
			}
		} );

		dialog.addEventListener( 'close', () => {
			document.body.classList.remove( 'service-popup-open' );
			servicePopupTrigger?.focus();
			servicePopupTrigger = null;
		} );
	} );

	const orphanSafeSelectors = 'main h1, main h2, main h3, main p, footer h2, footer p';

	document.querySelectorAll( orphanSafeSelectors ).forEach( ( element ) => {
		if ( element.closest( 'form' ) ) {
			return;
		}

		const walker = document.createTreeWalker( element, NodeFilter.SHOW_TEXT );
		const textNodes = [];
		let currentNode = walker.nextNode();

		while ( currentNode ) {
			if ( currentNode.nodeValue.trim() ) {
				textNodes.push( currentNode );
			}
			currentNode = walker.nextNode();
		}

		const lastTextNode = textNodes.at( -1 );
		if ( ! lastTextNode ) {
			return;
		}

		lastTextNode.nodeValue = lastTextNode.nodeValue.replace( /\s+(\S+)\s*$/, '\u00a0$1' );
	} );
} )();

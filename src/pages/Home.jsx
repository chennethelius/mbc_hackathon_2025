import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { getVouchesGiven, getVouchesReceived, getOtherVouches } from '../services/vouchService';
import { fetchUserProfile } from '../services/userSync';
import LoginModal from '../components/LoginModal';
import ProfileCard from '../components/ProfileCard';
import './Home.css';

function Home({ user, authenticated }) {
  const navigate = useNavigate();
  const { user: privyUser } = usePrivy();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const carouselRef = useRef(null);
  const [centerIndex, setCenterIndex] = useState(4); // Start with 5th card (index 4) centered
  const carousel2Ref = useRef(null);
  const [centerIndex2, setCenterIndex2] = useState(4); // Start with 5th card (index 4) centered
  const [vouchedFriends, setVouchedFriends] = useState([]); // People I've vouched for
  const [otherVouches, setOtherVouches] = useState([]); // Vouches not involving me (for top carousel)
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [vouchesCounts, setVouchesCounts] = useState({}); // Map of profileId -> total vouches count
  const [showVouchesPopup, setShowVouchesPopup] = useState(false);
  const [selectedProfileForVouches, setSelectedProfileForVouches] = useState(null);
  const [vouchesList, setVouchesList] = useState([]);
  
  // Load current user's profile
  useEffect(() => {
    const loadCurrentUserProfile = async () => {
      if (authenticated && privyUser?.id) {
        const result = await fetchUserProfile(privyUser.id);
        if (result.success && result.user?.profiles) {
          setCurrentUserProfile(result.user.profiles);
        }
      }
    };
    
    loadCurrentUserProfile();
  }, [authenticated, privyUser]);

  // Load friends you've vouched for (for bottom carousel)
  useEffect(() => {
    const loadVouchedFriends = async () => {
      if (authenticated && privyUser?.id) {
        console.log('🎯 Loading friends you\'ve vouched for...');
        
        const result = await getVouchesGiven(privyUser.id);
        
        if (result.success) {
          // Filter to only include friends with points > 0
          const friendsWithVouches = result.vouches.filter(v => v.points > 0);
          console.log('✅ Loaded', friendsWithVouches.length, 'vouched friends');
          setVouchedFriends(friendsWithVouches);
        } else {
          console.error('❌ Error loading vouched friends:', result.error);
        }
      }
    };

    loadVouchedFriends();
  }, [authenticated, privyUser]);

  // Load vouches not involving the current user (for top carousel)
  useEffect(() => {
    const loadOtherVouches = async () => {
      if (authenticated && privyUser?.id) {
        console.log('🎯 Loading other vouches (not involving me)...');
        
        const result = await getOtherVouches(privyUser.id);
        
        if (result.success) {
          console.log('✅ Loaded', result.vouches.length, 'other vouches');
          setOtherVouches(result.vouches || []);
        } else {
          console.error('❌ Error loading other vouches:', result.error);
        }
      }
    };

    loadOtherVouches();
  }, [authenticated, privyUser]);

  // Load total vouches counts for profiles in both carousels
  useEffect(() => {
    const loadVouchesCounts = async () => {
      const counts = {};
      
      // Get unique profile IDs from top carousel (vouchee profiles - people being vouched for)
      const topCarouselProfileIds = [...new Set(otherVouches.map(v => v.vouchee?.id).filter(Boolean))];
      
      // Get unique profile IDs from bottom carousel (people I've vouched for - vouchee profiles)
      const bottomCarouselProfileIds = [...new Set(vouchedFriends.map(f => f.vouchee?.id).filter(Boolean))];
      
      // Combine and deduplicate
      const uniqueProfileIds = [...new Set([...topCarouselProfileIds, ...bottomCarouselProfileIds])];
      
      if (uniqueProfileIds.length === 0) return;
      
      await Promise.all(
        uniqueProfileIds.map(async (profileId) => {
          const result = await getVouchesReceived(profileId);
          if (result.success) {
            counts[profileId] = result.vouches?.length || 0;
          } else {
            counts[profileId] = 0;
          }
        })
      );

      setVouchesCounts(counts);
    };

    loadVouchesCounts();
  }, [otherVouches, vouchedFriends]);

  // Create cards for top carousel - use vouches not involving me
  const originalCards = Array.from({ length: 10 }, (_, i) => {
    if (otherVouches.length > 0) {
      // Cycle through vouches not involving me (show the vouchee - person being vouched for)
      const vouch = otherVouches[i % otherVouches.length];
      return {
        id: i,
        vouch: vouch,
        profile: vouch.vouchee, // The person being vouched for
        voucher: vouch.voucher, // The person who vouched for them
        points: vouch.points,
      };
    }
    return {
      id: i,
      vouch: null,
      profile: null,
      voucher: null,
      points: 0,
    };
  });

  // Create cards for bottom carousel - cycle through people I've vouched for
  const originalCards2 = Array.from({ length: 10 }, (_, i) => {
    if (vouchedFriends.length > 0) {
      // Cycle through people I've vouched for
      const friend = vouchedFriends[i % vouchedFriends.length];
      return {
        id: i,
        name: friend.vouchee.display_name || friend.vouchee.username || 'Friend',
        profile: friend.vouchee, // Include full profile data
        vouch: friend,
      };
    }
    return {
      id: i,
      name: null,
      profile: null,
      vouch: null,
    };
  });

  // Create infinite loop by duplicating cards: [clone of last 5] + [original 10] + [clone of first 5]
  const cloneCount = 5;
  const cards = [
    ...originalCards.slice(-cloneCount).map((card, i) => ({ ...card, key: `clone-end-${i}` })),
    ...originalCards.map((card, i) => ({ ...card, key: `original-${i}` })),
    ...originalCards.slice(0, cloneCount).map((card, i) => ({ ...card, key: `clone-start-${i}` })),
  ];

  // Create infinite loop for bottom carousel
  const cards2 = [
    ...originalCards2.slice(-cloneCount).map((card, i) => ({ ...card, key: `clone-end-${i}` })),
    ...originalCards2.map((card, i) => ({ ...card, key: `original-${i}` })),
    ...originalCards2.slice(0, cloneCount).map((card, i) => ({ ...card, key: `clone-start-${i}` })),
  ];

  // Initialize carousel position to center the 5th card (accounting for clones)
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const cloneCount = 5;
    let initialized = false;
    
    const initializePosition = () => {
      if (initialized) return;
      
      const cardElement = carousel.querySelector('.carousel-card');
      if (!cardElement) return;
      
      const cardWidth = cardElement.offsetWidth;
      const gap = 32; // 2rem = 32px
      const totalCardWidth = cardWidth + gap;
      // Start at 5th original card (index 4 + 5 clones at start = 9)
      const initialScroll = totalCardWidth * (cloneCount + 4);
      
      carousel.scrollLeft = initialScroll;
      setCenterIndex(4); // Immediately set center index to match scroll position
      initialized = true;
    };

    // Try immediately and with small delay as backup
    initializePosition();
    const timer = setTimeout(initializePosition, 10);
    
    return () => clearTimeout(timer);
  }, []);

  // Initialize second carousel position to center the 5th card (accounting for clones)
  useEffect(() => {
    const carousel = carousel2Ref.current;
    if (!carousel) return;

    const cloneCount = 5;
    let initialized = false;
    
    const initializePosition = () => {
      if (initialized) return;
      
      const cardElement = carousel.querySelector('.carousel-card');
      if (!cardElement) return;
      
      const cardWidth = cardElement.offsetWidth;
      const gap = 32; // 2rem = 32px
      const totalCardWidth = cardWidth + gap;
      // Start at 5th original card (index 4 + 5 clones at start = 9)
      const initialScroll = totalCardWidth * (cloneCount + 4);
      
      carousel.scrollLeft = initialScroll;
      setCenterIndex2(4); // Immediately set center index to match scroll position
      initialized = true;
    };

    // Try immediately and with small delay as backup
    initializePosition();
    const timer = setTimeout(initializePosition, 10);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle scroll to update which card is centered and loop infinitely
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    
    let isJumping = false;
    let scrollTimer = null;
    const cloneCount = 5;
    const originalLength = 10;

    const handleScroll = () => {
      if (isJumping) return; // Don't update anything during jumps
      
      const cardElement = carousel.querySelector('.carousel-card');
      if (!cardElement) return;
      
      const cardWidth = cardElement.offsetWidth;
      const gap = 32; // 2rem = 32px
      const totalCardWidth = cardWidth + gap;
      const scrollLeft = carousel.scrollLeft;
      
      const currentIndex = Math.round(scrollLeft / totalCardWidth);
      
      // Update center index (relative to original cards) immediately for smooth scaling
      let displayIndex = currentIndex - cloneCount;
      
      // Handle wrapping for display
      if (displayIndex < 0) {
        displayIndex = originalLength + displayIndex;
      } else if (displayIndex >= originalLength) {
        displayIndex = displayIndex - originalLength;
      }
      
      setCenterIndex(displayIndex);
      
      // Clear previous timer
      if (scrollTimer) clearTimeout(scrollTimer);
      
      // Wait for scrolling to stop before checking loop
      scrollTimer = setTimeout(() => {
        if (isJumping) return;
        
        const currentScrollLeft = carousel.scrollLeft;
        const currentIdx = Math.round(currentScrollLeft / totalCardWidth);
        
        // If scrolled into left clones
        if (currentIdx < cloneCount) {
          isJumping = true;
          // Map back to the corresponding position in the original section
          const cardId = (originalLength - cloneCount) + currentIdx;
          const targetIndex = cloneCount + cardId;
          const targetScroll = totalCardWidth * targetIndex;
          
          // Update centerIndex to match target position BEFORE jumping
          setCenterIndex(cardId);
          
          // Instant jump without smooth scrolling
          carousel.style.scrollBehavior = 'auto';
          carousel.scrollLeft = targetScroll;
          
          setTimeout(() => {
            carousel.style.scrollBehavior = 'smooth';
            isJumping = false;
          }, 50);
          return;
        }
        
        // If scrolled into right clones
        if (currentIdx >= cloneCount + originalLength) {
          isJumping = true;
          // Map back to the corresponding position in the original section
          const offset = currentIdx - (cloneCount + originalLength);
          const targetIndex = cloneCount + offset;
          const targetScroll = totalCardWidth * targetIndex;
          
          // Update centerIndex to match target position BEFORE jumping
          setCenterIndex(offset);
          
          // Instant jump without smooth scrolling
          carousel.style.scrollBehavior = 'auto';
          carousel.scrollLeft = targetScroll;
          
          setTimeout(() => {
            carousel.style.scrollBehavior = 'smooth';
            isJumping = false;
          }, 50);
          return;
        }
      }, 100); // Reduced delay for faster response
    };

    carousel.addEventListener('scroll', handleScroll);
    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, []);

  // Handle scroll for second carousel to update which card is centered and loop infinitely
  useEffect(() => {
    const carousel = carousel2Ref.current;
    if (!carousel) return;
    
    let isJumping = false;
    let scrollTimer = null;
    const cloneCount = 5;
    const originalLength = 10;

    const handleScroll = () => {
      if (isJumping) return; // Don't update anything during jumps
      
      const cardElement = carousel.querySelector('.carousel-card');
      if (!cardElement) return;
      
      const cardWidth = cardElement.offsetWidth;
      const gap = 32; // 2rem = 32px
      const totalCardWidth = cardWidth + gap;
      const scrollLeft = carousel.scrollLeft;
      
      const currentIndex = Math.round(scrollLeft / totalCardWidth);
      
      // Update center index (relative to original cards) immediately for smooth scaling
      let displayIndex = currentIndex - cloneCount;
      
      // Handle wrapping for display
      if (displayIndex < 0) {
        displayIndex = originalLength + displayIndex;
      } else if (displayIndex >= originalLength) {
        displayIndex = displayIndex - originalLength;
      }
      
      setCenterIndex2(displayIndex);
      
      // Clear previous timer
      if (scrollTimer) clearTimeout(scrollTimer);
      
      // Wait for scrolling to stop before checking loop
      scrollTimer = setTimeout(() => {
        if (isJumping) return;
        
        const currentScrollLeft = carousel.scrollLeft;
        const currentIdx = Math.round(currentScrollLeft / totalCardWidth);
        
        // If scrolled into left clones
        if (currentIdx < cloneCount) {
          isJumping = true;
          // Map back to the corresponding position in the original section
          const cardId = (originalLength - cloneCount) + currentIdx;
          const targetIndex = cloneCount + cardId;
          const targetScroll = totalCardWidth * targetIndex;
          
          // Update centerIndex to match target position BEFORE jumping
          setCenterIndex2(cardId);
          
          // Instant jump without smooth scrolling
          carousel.style.scrollBehavior = 'auto';
          carousel.scrollLeft = targetScroll;
          
          setTimeout(() => {
            carousel.style.scrollBehavior = 'smooth';
            isJumping = false;
          }, 50);
          return;
        }
        
        // If scrolled into right clones
        if (currentIdx >= cloneCount + originalLength) {
          isJumping = true;
          // Map back to the corresponding position in the original section
          const offset = currentIdx - (cloneCount + originalLength);
          const targetIndex = cloneCount + offset;
          const targetScroll = totalCardWidth * targetIndex;
          
          // Update centerIndex to match target position BEFORE jumping
          setCenterIndex2(offset);
          
          // Instant jump without smooth scrolling
          carousel.style.scrollBehavior = 'auto';
          carousel.scrollLeft = targetScroll;
          
          setTimeout(() => {
            carousel.style.scrollBehavior = 'smooth';
            isJumping = false;
          }, 50);
          return;
        }
      }, 100); // Reduced delay for faster response
    };

    carousel.addEventListener('scroll', handleScroll);
    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, []);

  // Get scale for each card based on distance from center
  const getCardScale = (index) => {
    const cloneCount = 5;
    const adjustedCenterIndex = centerIndex + cloneCount;
    const distance = Math.abs(index - adjustedCenterIndex);
    if (distance === 0) return 1; // Center card
    if (distance === 1) return 0.85; // Adjacent cards
    if (distance === 2) return 0.7; // Outer cards
    return 0.6; // Far cards
  };

  // Get scale for each card in second carousel based on distance from center
  const getCardScale2 = (index) => {
    const cloneCount = 5;
    const adjustedCenterIndex = centerIndex2 + cloneCount;
    const distance = Math.abs(index - adjustedCenterIndex);
    if (distance === 0) return 1; // Center card
    if (distance === 1) return 0.85; // Adjacent cards
    if (distance === 2) return 0.7; // Outer cards
    return 0.6; // Far cards
  };

  // Handle info icon click
  const handleInfoClick = (card) => {
    setSelectedFriend(card);
    setShowInfoPopup(true);
  };

  // Close popup
  const closeInfoPopup = () => {
    setShowInfoPopup(false);
    setSelectedFriend(null);
  };

  // Handle vouches count badge click
  const handleVouchesBadgeClick = async (profile) => {
    if (!profile?.id) return;
    
    setSelectedProfileForVouches(profile);
    setShowVouchesPopup(true);
    
    // Fetch vouches received for this profile
    const result = await getVouchesReceived(profile.id);
    if (result.success) {
      // Filter out the current user's vouch to show only "other vouches"
      const otherVouches = (result.vouches || []).filter(
        vouch => vouch.voucher?.id !== privyUser?.id
      );
      setVouchesList(otherVouches);
    } else {
      console.error('Error loading vouches:', result.error);
      setVouchesList([]);
    }
  };

  // Close vouches popup
  const closeVouchesPopup = () => {
    setShowVouchesPopup(false);
    setSelectedProfileForVouches(null);
    setVouchesList([]);
  };

  if (!authenticated) {
    return (
      <div className="home-page">
        {/* Animated pastel background */}
        <div className="animated-bg">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
          <div className="blob blob-4"></div>
          <div className="blob blob-5"></div>
        </div>

        {/* Hero Section */}
        <div className="hero-content">
          <div className="hero-header">
            <h1 className="hero-title">💘 Dating Prediction Markets</h1>
            <p className="hero-subtitle">
              Bet on your friends' love lives with USDC on Base
            </p>
            <button className="cta-button" onClick={() => setShowLoginModal(true)}>
              Get Started 🚀
            </button>
          </div>

          {/* Feature Panels */}
          <div className="feature-panels">
            <div className="feature-card card-1">
              <div className="feature-icon">📊</div>
              <h3>Create Prediction Markets</h3>
              <p>
                Think your friends are going to date? Create a market and let everyone bet on the outcome with real USDC.
              </p>
            </div>

            <div className="feature-card card-2">
              <div className="feature-icon">💰</div>
              <h3>Bet & Win USDC</h3>
              <p>
                Put your money where your mouth is. Bet YES or NO on dating predictions and win USDC when markets resolve.
              </p>
            </div>

            <div className="feature-card card-3">
              <div className="feature-icon">👥</div>
              <h3>Connect with Friends</h3>
              <p>
                Add friends, share photo galleries, and keep track of everyone's dating drama in one place.
              </p>
            </div>

            <div className="feature-card card-4">
              <div className="feature-icon">⛓️</div>
              <h3>Built on Base</h3>
              <p>
                Powered by smart contracts on Base Sepolia. Your bets are transparent, secure, and on-chain.
              </p>
            </div>

            <div className="feature-card card-5">
              <div className="feature-icon">🎯</div>
              <h3>Fair Resolution</h3>
              <p>
                Market creators resolve outcomes after the deadline. Winners automatically claim their share of the pool.
              </p>
            </div>

            <div className="feature-card card-6">
              <div className="feature-icon">📸</div>
              <h3>Share Moments</h3>
              <p>
                Upload photos, build your profile, and document the relationships you're betting on.
              </p>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="footer-cta">
            <h2>Ready to predict the future? 🔮</h2>
            <button className="cta-button secondary" onClick={() => setShowLoginModal(true)}>
              Login to Start Betting
            </button>
          </div>
        </div>

        {/* Login Modal */}
        {showLoginModal && (
          <LoginModal onClose={() => setShowLoginModal(false)} />
        )}
      </div>
    );
  }

  // Matchmaking page for authenticated users
  return (
    <div className="matchmaking-page">
      {/* Animated pastel background */}
      <div className="animated-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="blob blob-4"></div>
        <div className="blob blob-5"></div>
      </div>

      <div className="matchmaking-content">
        {/* Carousel */}
        <div className="carousel-container">
          <div className="carousel-wrapper" ref={carouselRef}>
            {cards.map((card, index) => (
              <div
                key={card.key}
                className="carousel-card"
                style={{
                  transform: `scale(${getCardScale(index)})`,
                }}
              >
                <div className="card-content">
                  {card.profile ? (
                    <>
                      <div className="carousel-card-top-bar">
                        <span className="vouch-text">
                          <div>{card.voucher?.display_name || card.voucher?.username || 'Someone'}</div>
                          <div>vouched for ...</div>
                        </span>
                        {vouchesCounts[card.profile.id] !== undefined && vouchesCounts[card.profile.id] > 1 && (
                          <button 
                            className="vouches-count-badge"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVouchesBadgeClick(card.profile);
                            }}
                          >
                            +{vouchesCounts[card.profile.id] - 1}
                          </button>
                        )}
                      </div>
                      <div className="carousel-card-profile">
                        <ProfileCard profile={card.profile} compact={true} />
                      </div>
                    </>
                  ) : (
                    <div className="card-placeholder">
                      <div className="placeholder-icon">💝</div>
                      <h3>No vouches yet</h3>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Match Button */}
        <div className="match-button-container">
          <button className="match-button" onClick={() => {}}>
            Match! 💘
          </button>
        </div>

        {/* Second Carousel */}
        <div className="carousel-container">
          <div className="carousel-wrapper" ref={carousel2Ref}>
            {cards2.map((card, index) => (
              <div
                key={card.key}
                className="carousel-card"
                style={{
                  transform: `scale(${getCardScale2(index)})`,
                }}
              >
                <div className="card-content">
                  <div className="card-placeholder">
                    <div className="name-with-info">
                      <h3>{card.name || 'No vouches yet'}</h3>
                      {card.name && (
                        <button 
                          className="info-icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInfoClick(card);
                          }}
                          aria-label="More info"
                        >
                          <span className="info-icon">ⓘ</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Popup Modal */}
      {showInfoPopup && (
        <div className="info-popup-overlay" onClick={closeInfoPopup}>
          <div className="info-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-popup-btn" onClick={closeInfoPopup}>
              ×
            </button>
            <div className="info-popup-content">
              <ProfileCard profile={selectedFriend?.profile} />
            </div>
          </div>
        </div>
      )}

      {/* Vouches Popup Modal */}
      {showVouchesPopup && (
        <div className="info-popup-overlay" onClick={closeVouchesPopup}>
          <div className="info-popup vouches-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-popup-btn" onClick={closeVouchesPopup}>
              ×
            </button>
            <div className="info-popup-content">
              <h3>
                {selectedProfileForVouches?.display_name || selectedProfileForVouches?.username || 'User'}'s Vouches
              </h3>
              {vouchesList.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
                  No other vouches yet.
                </p>
              ) : (
                <div className="vouches-list">
                  {vouchesList.map((vouch) => (
                    <div key={vouch.id} className="vouch-item">
                      <div className="vouch-item-header">
                        <div className="vouch-item-voucher">
                          {vouch.voucher?.avatar_url ? (
                            <img 
                              src={vouch.voucher.avatar_url} 
                              alt={vouch.voucher.display_name || vouch.voucher.username || 'User'}
                              className="vouch-item-avatar"
                            />
                          ) : (
                            <div className="vouch-item-avatar-placeholder">
                              {(vouch.voucher?.display_name || vouch.voucher?.username || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <span className="vouch-item-name">
                            {vouch.voucher?.display_name || vouch.voucher?.username || 'Unknown User'}
                          </span>
                        </div>
                        <div className="vouch-item-points">
                          {vouch.points} {vouch.points === 1 ? 'point' : 'points'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;


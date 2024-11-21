<template>
  <div class="container">
    <div class="pond">
      <div class="koi-container" ref="koiContainer">
        <div
          v-for="i in 8"
          :key="i"
          class="background-koi"
          :style="{
            '--hue-rotate': `${i * 45}deg`,
            animationDelay: `${-i * 3}s`,
          }"
        ></div>
      </div>
      <div class="wish-panel">
        <h2 class="title">电子锦鲤祈福</h2>
        <div class="luck-meter" v-if="currentLuck > 0">
          <span class="luck-text">当前幸运值: {{ currentLuck }}%</span>
          <div class="luck-bar">
            <div class="luck-progress" :style="{ width: currentLuck + '%' }"></div>
          </div>
        </div>
        <input
          type="text"
          v-model="wishText"
          class="wish-input"
          ref="wishInput"
          placeholder="在此输入您的愿望..."
          @keyup.enter="makeWish"
        />
        <div class="button-group">
          <button ref="wishBtn" class="wish-btn" @click="makeWish">
            <span class="button-icon">🙏</span>
            祈愿
          </button>
          <button class="share-button" @click="shareWishes">
            <span class="button-icon">🔗</span>
            分享
          </button>
        </div>
        <div class="wish-counter">已有 {{ wishCount }} 个愿望被实现</div>
      </div>
    </div>
    <div class="wishes-list">
      <h3>
        <span class="list-icon">📜</span>
        最近的祈愿
      </h3>
      <div class="wishes-container">
        <div v-if="wishes.length === 0" class="no-wishes">
          还没有人许愿呢，快来成为第一个吧！
        </div>
        <transition-group name="wish-list">
          <div v-for="wish in wishes" 
               :key="wish.id" 
               class="wish-item">
            <div class="wish-content">
              <span class="wish-text">{{ wish.text }}</span>
              <span class="wish-date">{{ wish.date }}</span>
            </div>
            <button class="delete-btn" @click="deleteWish(wish.id)">
              <span class="button-icon">🗑️</span>
            </button>
          </div>
        </transition-group>
      </div>
    </div>
    <div class="audio-controls">
      <button class="audio-button" @click="toggleBGM">
        <span class="button-icon">{{ isBGMPlaying ? '🔊' : '🔈' }}</span>
      </button>
    </div>
    <audio ref="wishSound" src="/sounds/wish-sound.mp3" preload="auto"></audio>
    <audio ref="backgroundMusic" src="/sounds/peaceful-bgm.mp3" loop preload="auto"></audio>
    <audio ref="successSound" src="/sounds/success-sound.mp3" preload="auto"></audio>
    <audio ref="failSound" src="/sounds/fail-sound.mp3" preload="auto"></audio>
    <audio ref="wishingSound" src="/sounds/wishing-sound.mp3" preload="auto"></audio>
    <div class="koi-animation" v-if="showKoiAnimation">
      <img
        src="@/assets/koi-appear.gif"
        alt="锦鲤现身"
        @animationend="hideKoiAnimation"
      />
    </div>
    <div class="result-modal" v-if="showResult">
      <div class="result-content" :class="{ 'success': isWishSuccess, 'fail': !isWishSuccess }">
        <h3>{{ isWishSuccess ? '祈愿成功！' : '祈愿失败...' }}</h3>
        <p>{{ resultMessage }}</p>
        <button @click="closeResult" class="close-result">确定</button>
      </div>
    </div>
    <div class="music-tip" v-if="showMusicTip">
      点击任意处开始播放背景音乐 🎵
    </div>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      wishText: "",
      wishCount: parseInt(localStorage.getItem("wishCount")) || 0,
      wishes: JSON.parse(localStorage.getItem("wishes")) || [],
      isBGMPlaying: false,
      showKoiAnimation: false,
      currentLuck: 0,
      showResult: false,
      isWishSuccess: false,
      resultMessage: '',
      wishProbabilities: {
        '发财': 30,
        '健康': 70,
        '学习': 60,
        '爱情': 40,
        '事业': 50,
        '考试': 55,
        '升职': 35,
        '减肥': 45,
        '旅行': 65,
        '其他': 50
      },
      showMusicTip: true,
    };
  },
  methods: {
    createKoi() {
      const koi = document.createElement("div");
      koi.className = "koi";

      // 随机颜色
      const hue = Math.random() * 360;
      koi.style.setProperty("--hue-rotate", `${hue}deg`);

      // 随机初始位置
      const startX = Math.random() * this.$refs.koiContainer.offsetWidth;
      koi.style.left = `${startX}px`;
      koi.style.bottom = "-50px";

      this.$refs.koiContainer.appendChild(koi);

      // 高级动画
      const jumpHeight = -300 - Math.random() * 100;
      const rotation = 45 + Math.random() * 45;
      const duration = 1500 + Math.random() * 500;

      const animation = koi.animate(
        [
          { transform: "translateY(0) rotate(0deg) scale(1)", opacity: 1 },
          {
            transform: `translateY(${jumpHeight}px) rotate(${rotation}deg) scale(1.2)`,
            opacity: 1,
            offset: 0.6,
          },
          {
            transform: `translateY(${jumpHeight * 1.2}px) rotate(${
              rotation * 1.2
            }deg) scale(1)`,
            opacity: 0,
          },
        ],
        {
          duration,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        }
      );

      animation.onfinish = () => koi.remove();
    },
    calculateWishProbability(wishText) {
      // 根据愿望内容计算基础概率
      let baseProb = 50; // 默认基础概率
      
      for (const [keyword, prob] of Object.entries(this.wishProbabilities)) {
        if (wishText.includes(keyword)) {
          baseProb = prob;
          break;
        }
      }
      
      // 加上幸运值加成
      return Math.min(baseProb + this.currentLuck, 100);
    },
    playAudio(audioRef) {
      try {
        const audio = this.$refs[audioRef];
        if (audio) {
          audio.currentTime = 0;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.log(`播放${audioRef}失败:`, error);
            });
          }
        }
      } catch (error) {
        console.log(`${audioRef}播放出错:`, error);
      }
    },
    stopAudio(audioRef) {
      try {
        const audio = this.$refs[audioRef];
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      } catch (error) {
        console.log(`停止${audioRef}出错:`, error);
      }
    },
    async makeWish() {
      const wishBtn = this.$refs.wishBtn;
      if (!wishBtn) return;
      
      wishBtn.classList.add('disabled');
      
      if (!this.wishText.trim()) {
        const wishInput = this.$refs.wishInput;
        if (wishInput) {
          wishInput.classList.add('shake');
          setTimeout(() => {
            wishInput.classList.remove('shake');
          }, 500);
        }
        wishBtn.classList.remove('disabled');
        return;
      }

      // 播放许愿中的音效
      this.stopAudio('backgroundMusic');
      this.playAudio('wishingSound');

      // 模拟许愿过程的延迟
      await new Promise(resolve => setTimeout(resolve, 2000));

      const probability = this.calculateWishProbability(this.wishText);
      const isSuccess = Math.random() * 100 <= probability;
      
      this.isWishSuccess = isSuccess;
      
      // 停止许愿中的音效
      this.stopAudio('wishingSound');
      
      if (isSuccess) {
        // 祈愿成功音效
        this.playAudio('successSound');
        this.resultMessage = '恭喜！锦鲤眷顾了你！';
        this.showKoiAnimation = true;
        
        const newWish = {
          id: Date.now(),
          text: this.wishText,
          date: new Date().toLocaleString()
        };
        
        // 只保存到本地
        this.wishes.unshift(newWish);
        this.wishes = this.wishes.slice(0, 10);
        localStorage.setItem('wishes', JSON.stringify(this.wishes));
        
        this.wishCount++;
        localStorage.setItem('wishCount', this.wishCount);
        
        this.currentLuck = 0;
        this.createKois();
        this.wishText = '';
      } else {
        // 祈愿失败音效
        this.playAudio('failSound');
        this.currentLuck += 10;
        this.resultMessage = `祈愿失败...但是你获得了10%幸运值加成！\n当前成功率: ${probability}%\n再试一次吧！`;
      }
      
      this.showResult = true;

      // 3秒后恢复背景音乐
      setTimeout(() => {
        if (this.isBGMPlaying) {
          this.playAudio('backgroundMusic');
        }
      }, 3000);
    },
    toggleBGM() {
      try {
        const bgm = this.$refs.backgroundMusic;
        if (bgm) {
          if (this.isBGMPlaying) {
            bgm.pause();
          } else {
            const playPromise = bgm.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.log("播放背景音乐失败:", error);
              });
            }
          }
          this.isBGMPlaying = !this.isBGMPlaying;
        }
      } catch (error) {
        console.log("背景音乐控制出错:", error);
      }
    },
    createKois() {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => this.createKoi(), i * 200);
      }
    },
    shareWishes() {
      const shareText = `我在电子锦鲤祈福已经祈愿了${this.wishCount}次！`;
      if (navigator.share) {
        navigator.share({
          title: "电子锦鲤祈福",
          text: shareText,
          url: window.location.href,
        });
      } else {
        alert(shareText + "\n\n复制这段文字分享给好友吧！");
      }
    },
    hideKoiAnimation() {
      this.showKoiAnimation = false;
    },
    async deleteWish(wishId) {
      if (confirm('确定要删除这个愿望吗？')) {
        // 只从本地删除
        this.wishes = this.wishes.filter(wish => wish.id !== wishId);
        localStorage.setItem('wishes', JSON.stringify(this.wishes));
        
        // 更新愿望计数
        this.wishCount = Math.max(0, this.wishCount - 1);
        localStorage.setItem('wishCount', this.wishCount);
      }
    },
    closeResult() {
      this.showResult = false;
      const wishBtn = this.$refs.wishBtn;
      if (wishBtn) {
        wishBtn.classList.remove('disabled');
      }
      if (!this.isWishSuccess) {
        this.$refs.wishInput?.focus();
      }
      
      // 恢复背景音乐
      if (this.isBGMPlaying) {
        this.playAudio('backgroundMusic');
      }
    },
  },
  mounted() {
    // 只保留音频初始化相关代码
    const initAudio = () => {
      const audioRefs = ['wishSound', 'backgroundMusic', 'successSound', 'failSound', 'wishingSound'];
      audioRefs.forEach(ref => {
        const audio = this.$refs[ref];
        if (audio) {
          audio.load();
          audio.volume = 0.5;
        }
      });
    };

    const handleFirstInteraction = () => {
      initAudio();
      this.showMusicTip = false;
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      
      const bgm = this.$refs.backgroundMusic;
      if (bgm) {
        bgm.play().then(() => {
          this.isBGMPlaying = true;
        }).catch(error => {
          console.log('背景音乐播放失败:', error);
        });
      }
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    this.showMusicTip = true;
  }
};
</script>

<style>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  box-sizing: border-box;
}

.pond {
  position: relative;
  background: linear-gradient(180deg, #4a90e2, #357abd);
  border-radius: 15px;
  min-height: 400px;
  overflow: hidden;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.koi-container {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

.background-koi {
  position: absolute;
  width: 80px;
  height: 48px;
  background: url("@/assets/koi.svg") no-repeat;
  background-size: contain;
  opacity: 0.6;
  filter: hue-rotate(var(--hue-rotate, 0deg));
  animation: swim 15s linear infinite;
}

.background-koi:nth-child(2n) {
  --hue-rotate: 45deg;
  animation-duration: 17s;
  animation-delay: -5s;
}

.background-koi:nth-child(3n) {
  --hue-rotate: 90deg;
  animation-duration: 20s;
  animation-delay: -8s;
}

.background-koi:nth-child(4n) {
  --hue-rotate: 135deg;
  animation-duration: 22s;
  animation-delay: -12s;
}

.background-koi:nth-child(5n) {
  --hue-rotate: 180deg;
  animation-duration: 25s;
  animation-delay: -15s;
}

@keyframes swim {
  0% {
    transform: translate(-100%, 100%) rotate(10deg);
  }
  25% {
    transform: translate(25%, 0%) rotate(-15deg);
  }
  50% {
    transform: translate(150%, -50%) rotate(10deg);
  }
  75% {
    transform: translate(25%, -100%) rotate(-15deg);
  }
  100% {
    transform: translate(-100%, 100%) rotate(10deg);
  }
}

.koi {
  position: absolute;
  width: 80px;
  height: 48px;
  background: url("@/assets/koi.svg") no-repeat;
  background-size: contain;
  filter: hue-rotate(var(--hue-rotate, 0deg));
  will-change: transform;
  pointer-events: none;
}

.wish-panel {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.6);
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-sizing: border-box;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.wish-input {
  width: 100%;
  padding: 10px;
  border: 2px solid #4a90e2;
  border-radius: 5px;
  margin-bottom: 10px;
  box-sizing: border-box;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s ease;
}

.wish-input:focus {
  border-color: #357abd;
  box-shadow: 0 0 5px rgba(74, 144, 226, 0.3);
}

.wish-btn, .share-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 1.1em;
  border-radius: 25px;
  transition: transform 0.2s, box-shadow 0.2s;
  background: linear-gradient(45deg, #4a90e2, #357abd);
  color: white;
  border: none;
  cursor: pointer;
}

.wish-btn:hover, .share-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.wish-btn:active, .share-button:active {
  transform: translateY(1px);
}

.wish-btn.disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.koi-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.3s ease-in-out;
}

.koi-animation img {
  max-width: 80%;
  max-height: 80%;
  animation: koiAppear 2s ease-in-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes koiAppear {
  0% {
    transform: scale(0.5) rotate(-10deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(5deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
}

.title {
  color: #333;
  text-align: center;
  font-size: 2em;
  margin-bottom: 20px;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 20px 0;
}

.button-icon {
  font-size: 1.2em;
}

.audio-controls {
  position: fixed;
  bottom: 20px;
  right: max(20px, calc((100% - 800px) / 2 + 20px));
  z-index: 1000;
}

.audio-button {
  background: rgba(255,255,255,0.9);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.audio-button:hover {
  transform: scale(1.1);
}

.shake {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.delete-btn {
  background: none;
  border: none;
  color: #ff4444;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
  opacity: 0.6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  opacity: 1;
  background-color: rgba(255, 68, 68, 0.1);
  transform: scale(1.1);
}

.delete-btn .button-icon {
  font-size: 1.2em;
}

.result-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
  backdrop-filter: blur(5px);
}

.result-content {
  background: white;
  padding: 30px;
  border-radius: 20px;
  text-align: center;
  max-width: 80%;
  animation: popIn 0.3s ease-out;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.result-content.success {
  border-top: 5px solid #4CAF50;
}

.result-content.fail {
  border-top: 5px solid #f44336;
}

.result-content h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.5em;
}

.result-content p {
  margin: 15px 0;
  white-space: pre-line;
  color: #666;
  line-height: 1.6;
}

.close-result {
  margin-top: 20px;
  padding: 12px 35px;
  border: none;
  border-radius: 25px;
  font-size: 1.1em;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  font-weight: 500;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.success .close-result {
  background: linear-gradient(45deg, #4CAF50, #45a049);
}

.fail .close-result {
  background: linear-gradient(45deg, #4a90e2, #357abd);
}

.close-result:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.close-result:active {
  transform: translateY(1px);
}

@keyframes popIn {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .result-content {
    width: 90%;
    margin: 20px;
    padding: 25px;
  }
  
  .result-content h3 {
    font-size: 1.3em;
  }
  
  .close-result {
    width: 100%;
    padding: 15px;
  }
}

.music-tip {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 24px;
  border-radius: 20px;
  font-size: 1em;
  z-index: 1000;
  transition: opacity 0.5s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
}

.music-tip::before {
  content: '🎵';
  font-size: 1.2em;
}

.wish-counter {
  color: #333;
  font-weight: 500;
  text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.5);
}

.wishes-list {
  margin-top: 20px;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 60px;
}

.wishes-container {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  scrollbar-width: thin;
  scrollbar-color: #4a90e2 #f0f0f0;
}

.wishes-container::-webkit-scrollbar {
  width: 8px;
}

.wishes-container::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}

.wishes-container::-webkit-scrollbar-thumb {
  background: #4a90e2;
  border-radius: 4px;
}

.wish-item {
  background: white;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: slideIn 0.5s ease-out forwards;
}

.wish-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.wish-text {
  font-size: 1.1em;
  color: #333;
}

.wish-date {
  font-size: 0.8em;
  color: #666;
}

.no-wishes {
  text-align: center;
  color: #666;
  padding: 20px;
}

.list-icon {
  margin-right: 8px;
}

/* 添加愿望列表的动画 */
.wish-list-enter-active,
.wish-list-leave-active {
  transition: all 0.5s ease;
}

.wish-list-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.wish-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@media (max-width: 768px) {
  .wishes-list {
    margin: 10px 0 60px 0;
  }
  
  .wish-item {
    padding: 12px;
  }
  
  .wish-text {
    font-size: 1em;
  }
}
</style>

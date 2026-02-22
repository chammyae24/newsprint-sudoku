import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* iOS PWA compatibility */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Sudoku" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Add any additional <head> elements that you want globally available on web... */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          body {
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
          }

          /* ===== Animated Splash Screen ===== */
          #splash-screen {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 99999;
            background-color: #F5EDE0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: opacity 0.4s ease-out;
          }
          #splash-screen.splash-hide {
            opacity: 0;
            pointer-events: none;
          }

          .splash-row {
            display: flex;
            flex-direction: row;
            align-items: flex-end;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 4px;
          }

          .splash-letter {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 2px;
            box-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            margin: 0 1px;
            opacity: 0;
            transform: scale(0) rotate(0deg);
            animation: splash-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            font-family: 'PlayfairDisplay_900Black', 'Playfair Display', Georgia, serif;
            font-weight: 900;
            line-height: 1.15;
          }

          @keyframes splash-pop {
            0% {
              opacity: 0;
              transform: scale(0) rotate(-8deg);
            }
            60% {
              opacity: 1;
              transform: scale(1.15) rotate(2deg);
            }
            80% {
              transform: scale(0.95) rotate(-1deg);
            }
            100% {
              opacity: 1;
              transform: scale(1) rotate(var(--r, 0deg));
            }
          }

          /* Subtle float after pop-in */
          @keyframes splash-float {
            0%, 100% { transform: translateY(0px) rotate(var(--r, 0deg)); }
            50% { transform: translateY(-3px) rotate(var(--r, 0deg)); }
          }

          .splash-letter.floated {
            animation: splash-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                       splash-float 2.5s ease-in-out infinite;
            animation-delay: var(--d, 0s), calc(var(--d, 0s) + 0.5s);
          }

          /* Loading dots */
          .splash-dots {
            display: flex;
            gap: 8px;
            margin-top: 40px;
          }
          .splash-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #8B7355;
            opacity: 0.3;
            animation: splash-dot-pulse 1.4s ease-in-out infinite;
          }
          .splash-dot:nth-child(2) { animation-delay: 0.2s; }
          .splash-dot:nth-child(3) { animation-delay: 0.4s; }

          @keyframes splash-dot-pulse {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1.2); }
          }
        `,
          }}
        />
      </head>
      <body>
        {/* Animated Splash Screen - shows immediately, hides when React mounts */}
        <div
          id="splash-screen"
          dangerouslySetInnerHTML={{
            __html: `
          <div class="splash-row">
            <div class="splash-letter floated" style="background:#EDB942; --r:-2deg; --d:0s; font-size:58px; padding:3.5px 10.5px; color:#2E1C00;">N</div>
            <div class="splash-letter floated" style="background:#D4C5A8; --r:1deg; --d:0.06s; font-size:50px; padding:3px 9px; color:#2A2118;">E</div>
            <div class="splash-letter floated" style="background:#FDF8F0; --r:-1deg; --d:0.12s; font-size:52px; padding:3.1px 9.4px; color:#2A2118;">W</div>
            <div class="splash-letter floated" style="background:#E0D5BF; --r:2deg; --d:0.18s; font-size:48px; padding:2.9px 8.6px; color:#3A2A1C;">S</div>
            <div class="splash-letter floated" style="background:#2A2118; --r:-3deg; --d:0.24s; font-size:54px; padding:3.2px 9.7px; color:#FFFFFF;">P</div>
            <div class="splash-letter floated" style="background:#FDF8F0; --r:1deg; --d:0.30s; font-size:46px; padding:2.8px 8.3px; color:#2A2118;">R</div>
            <div class="splash-letter floated" style="background:#4A3828; --r:-1deg; --d:0.36s; font-size:50px; padding:3px 9px; color:#F5EDE0;">I</div>
            <div class="splash-letter floated" style="background:#D4C5A8; --r:2deg; --d:0.42s; font-size:48px; padding:2.9px 8.6px; color:#2A2118;">N</div>
            <div class="splash-letter floated" style="background:#FDF8F0; --r:-2deg; --d:0.48s; font-size:52px; padding:3.1px 9.4px; color:#3A2A1C;">T</div>
          </div>
          <div class="splash-row">
            <div class="splash-letter floated" style="background:#E0D5BF; --r:2deg; --d:0.54s; font-size:54px; padding:3.2px 9.7px; color:#2A2118;">S</div>
            <div class="splash-letter floated" style="background:#2A2118; --r:-1deg; --d:0.60s; font-size:50px; padding:3px 9px; color:#F5EDE0;">U</div>
            <div class="splash-letter floated" style="background:#FDF8F0; --r:1deg; --d:0.66s; font-size:56px; padding:3.4px 10.1px; color:#2A2118;">D</div>
            <div class="splash-letter floated" style="background:#EDB942; --r:-2deg; --d:0.72s; font-size:48px; padding:2.9px 8.6px; color:#3A2A1C;">O</div>
            <div class="splash-letter floated" style="background:#4A3828; --r:3deg; --d:0.78s; font-size:54px; padding:3.2px 9.7px; color:#F5EDE0;">K</div>
            <div class="splash-letter floated" style="background:#FDF8F0; --r:-1deg; --d:0.84s; font-size:50px; padding:3px 9px; color:#2A2118;">U</div>
          </div>
          <div class="splash-dots">
            <div class="splash-dot"></div>
            <div class="splash-dot"></div>
            <div class="splash-dot"></div>
          </div>
        `,
          }}
        />

        {children}

        {/* Script to hide splash once React mounts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function() {
            var splash = document.getElementById('splash-screen');
            if (!splash) return;

            // Use MutationObserver to detect when React renders content into #root
            var root = document.getElementById('root');
            if (root) {
              var observer = new MutationObserver(function(mutations) {
                // Check if root has meaningful content (React has mounted)
                if (root.children.length > 0) {
                  // Small delay to ensure smooth transition
                  setTimeout(function() {
                    splash.classList.add('splash-hide');
                    setTimeout(function() {
                      splash.remove();
                    }, 500);
                  }, 300);
                  observer.disconnect();
                }
              });
              observer.observe(root, { childList: true, subtree: true });
            }

            // Fallback: remove splash after 8 seconds no matter what
            setTimeout(function() {
              if (splash && splash.parentNode) {
                splash.classList.add('splash-hide');
                setTimeout(function() {
                  splash.remove();
                }, 500);
              }
            }, 8000);
          })();
        `,
          }}
        />
      </body>
    </html>
  );
}

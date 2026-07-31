import React, { useEffect, useRef } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+{}|:"<>?~`-=[]\\;\',./';

const AsciiBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let particles = [];
    const mouse = { x: -100, y: -100, vx: 0, vy: 0 };
    let lastMouse = { x: -100, y: -100 };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e) => {
      lastMouse.x = mouse.x;
      lastMouse.y = mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.vx = mouse.x - lastMouse.x;
      mouse.vy = mouse.y - lastMouse.y;
      
      // Spawn characters on cursor movement
      const spawnCount = Math.min(Math.floor(Math.abs(mouse.vx) + Math.abs(mouse.vy)) / 5, 5) + 1;
      
      for (let i = 0; i < spawnCount; i++) {
        if (Math.random() > 0.3) {
          particles.push({
            x: mouse.x + (Math.random() - 0.5) * 50,
            y: mouse.y + (Math.random() - 0.5) * 50,
            vx: mouse.vx * 0.05 + (Math.random() - 0.5) * 1,
            vy: mouse.vy * 0.05 + (Math.random() - 0.5) * 1,
            char: CHARS[Math.floor(Math.random() * CHARS.length)],
            life: 1,
            decay: 0.01 + Math.random() * 0.02
          });
        }
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);

    // Initial random ambient particles
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        life: Math.random(),
        decay: 0.002 + Math.random() * 0.005
      });
    }

    let animationFrame;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Use the Linux Green from the terminal theme (#8fdf82)
      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        
        // Randomly change character sometimes (matrix effect)
        if (Math.random() < 0.05) {
          p.char = CHARS[Math.floor(Math.random() * CHARS.length)];
        }

        if (p.life <= 0) {
          particles.splice(i, 1);
          
          // Re-spawn ambient particles gently
          if (particles.length < 40 && Math.random() < 0.1) {
            particles.push({
              x: Math.random() * width,
              y: Math.random() * height,
              vx: (Math.random() - 0.5) * 0.2,
              vy: (Math.random() - 0.5) * 0.2,
              char: CHARS[Math.floor(Math.random() * CHARS.length)],
              life: 1,
              decay: 0.002 + Math.random() * 0.005
            });
          }
          continue;
        }

        // Apply theme color fading out with life
        ctx.fillStyle = `rgba(143, 223, 130, ${p.life * 0.7})`; // --linux-green #8fdf82
        
        // Very occasional red/pink glitch char for the "shoegaze" theme
        if (Math.random() < 0.01) {
          ctx.fillStyle = `rgba(255, 126, 179, ${p.life * 0.8})`; // --accent-color #ff7eb3
        }

        ctx.fillText(p.char, p.x, p.y);
      }
      
      animationFrame = requestAnimationFrame(draw);
    };
    
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
};

export default AsciiBackground;

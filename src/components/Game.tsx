import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { ImageUploader } from './ImageUploader';

const DEFAULT_FRUITS = [
  { name: 'cherry', radius: 15, color: '#FF0000' },
  { name: 'strawberry', radius: 20, color: '#FF69B4' },
  { name: 'grape', radius: 25, color: '#800080' },
  { name: 'orange', radius: 30, color: '#FFA500' },
  { name: 'apple', radius: 35, color: '#FF0000' },
  { name: 'pear', radius: 40, color: '#90EE90' },
  { name: 'peach', radius: 45, color: '#FFE5B4' },
  { name: 'pineapple', radius: 50, color: '#FFD700' },
  { name: 'melon', radius: 55, color: '#98FF98' },
  { name: 'watermelon', radius: 60, color: '#FF6B6B' },
];

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine>();
  const currentFruitRef = useRef(0);
  const [customImages, setCustomImages] = useState<string[]>(
    JSON.parse(localStorage.getItem('watermelon-custom-images') || '[]')
  );
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = Matter.Engine.create();
    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: 400,
        height: 600,
        wireframes: false,
        background: '#F0F0F0'
      }
    });

    engineRef.current = engine;

    const walls = [
      Matter.Bodies.rectangle(200, 610, 400, 20, { isStatic: true }),
      Matter.Bodies.rectangle(-10, 300, 20, 600, { isStatic: true }),
      Matter.Bodies.rectangle(410, 300, 20, 600, { isStatic: true }),
    ];

    Matter.World.add(engine.world, walls);

    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA as Matter.Body & { fruitIndex?: number };
        const bodyB = pair.bodyB as Matter.Body & { fruitIndex?: number };

        if (bodyA.fruitIndex !== undefined && bodyB.fruitIndex !== undefined) {
          if (bodyA.fruitIndex === bodyB.fruitIndex && bodyA.fruitIndex < DEFAULT_FRUITS.length - 1) {
            Matter.World.remove(engine.world, [bodyA, bodyB]);
            
            const newFruitIndex = bodyA.fruitIndex + 1;
            const newFruit = createFruit(
              (bodyA.position.x + bodyB.position.x) / 2,
              (bodyA.position.y + bodyB.position.y) / 2,
              newFruitIndex
            );
            Matter.World.add(engine.world, newFruit);
          }
        }
      });
    });

    Matter.Runner.run(engine);
    Matter.Render.run(render);

    return () => {
      Matter.Render.stop(render);
      Matter.Engine.clear(engine);
    };
  }, []);

  const createFruit = (x: number, y: number, fruitIndex: number) => {
    const fruit = DEFAULT_FRUITS[fruitIndex];
    const body = Matter.Bodies.circle(x, y, fruit.radius, {
      restitution: 0.3,
      render: {
        sprite: {
          texture: customImages[fruitIndex] || '',
          xScale: fruit.radius * 2 / 100,
          yScale: fruit.radius * 2 / 100,
        },
        fillStyle: customImages[fruitIndex] ? 'transparent' : fruit.color
      }
    }) as Matter.Body & { fruitIndex?: number };
    
    body.fruitIndex = fruitIndex;
    return body;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const fruit = createFruit(x, 50, currentFruitRef.current);
    Matter.World.add(engineRef.current.world, fruit);

    currentFruitRef.current = (currentFruitRef.current + 1) % 3;
  };

  const handleImagesSet = (images: string[]) => {
    setCustomImages(images);
    
    // Generate share URL
    const params = new URLSearchParams();
    params.set('images', JSON.stringify(images));
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    setShareUrl(url);
  };

  useEffect(() => {
    // Load shared images from URL if present
    const params = new URLSearchParams(window.location.search);
    const sharedImages = params.get('images');
    if (sharedImages) {
      try {
        const images = JSON.parse(sharedImages);
        setCustomImages(images);
        localStorage.setItem('watermelon-custom-images', sharedImages);
      } catch (e) {
        console.error('Invalid shared images data');
      }
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">Watermelon Game</h1>
      <ImageUploader 
        onImagesSet={handleImagesSet}
        defaultImages={customImages.length ? customImages : Array(10).fill('')}
      />
      <canvas 
        ref={canvasRef} 
        onClick={handleClick}
        className="border-2 border-gray-300 rounded-lg"
      />
      {shareUrl && (
        <div className="max-w-md p-4 bg-white rounded-lg shadow-md">
          <p className="text-sm font-medium mb-2">Share your custom game:</p>
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="w-full p-2 text-sm bg-gray-50 border rounded"
            onClick={e => (e.target as HTMLInputElement).select()}
          />
        </div>
      )}
      <p className="text-sm text-gray-600">Click to drop fruits!</p>
    </div>
  );
}
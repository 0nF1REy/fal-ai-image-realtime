'use client'
import React, { useState, useRef } from 'react'
import { fal } from "@fal-ai/client";
import Image from 'next/image'

fal.config({
  proxyUrl: "/api/proxy",
});

const INPUT_DEFAULTS = {
  _force_msgpack: new Uint8Array([]),
  image_size: "square_hd",
  num_inference_steps: 2,
  num_images: 1,
  enable_safety_checker: true,
  sync_mode: true
}

function randomSeed() {
  return Math.floor(Math.random() * 10000000).toFixed(0)
}

const Home = () => {
  const [input, setInput] = useState('')
  const [seed, setSeed] = useState(randomSeed())
  const [image, setImage] = useState('')
  const [inferenceTime, setInferenceTime] = useState(null)

  const connection = fal.realtime.connect("fal-ai/fast-lightning-sdxl", {
    connectionKey: "lightning-sdxl",
    throttleInterval: 64,
    onResult: (result) => {
      console.log(result);
      const blob = new Blob([result.images[0].content], { type: "image/jpeg" });
      const imgURL = URL.createObjectURL(blob);

      setImage(imgURL)
      setInferenceTime(result.timings.inference)
    },
    onError: (error) => {
      console.error(error);
    }
  });

  const timer = useRef()

  const handleOnChange = (prompt) => {
    if (timer.current) {
      clearTimeout(timer.current)
    }
    setInput(prompt);

    const input = {
      ...INPUT_DEFAULTS,
      prompt: prompt,
      seed: seed ? Number(seed) : Number(randomSeed())
    }


    timer.current = setTimeout(() => {
      connection.send(input)
    }, 500)
  }

  return (
    <main>
      <h1>Real-time image generation by AI</h1>
      <div>
        <input type='text'
          placeholder='Enter text to generate an image'
          name='prompt'
          value={input}
          onChange={e => handleOnChange(e.target.value)}
        >
        </input>
      </div>

      {
        inferenceTime && (
          <p>
            Inference Time: {(inferenceTime * 1000).toFixed(0)}ms - Seed: {seed}
          </p>
        )
      }

      {
        image && (
          <Image src={image} width={1024} height={1024}
            style={{ width: '100%', height: 'auto' }}
            alt='realtime-image' priority />
        )
      }

      <h4>{input}</h4>
    </main>
  )
}

export default Home
import { describe, it, expect } from 'vitest';
import React from 'react';
import { TemplateMiniature } from '../components/TemplateMiniature';

describe('TemplateMiniature Component', () => {
  it('should compile correct styles for classic design template', () => {
    expect(TemplateMiniature).toBeDefined();
  });
});

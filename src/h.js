// Единая точка импорта React-совместимого API.
// Используем Preact (3KB) + htm для JSX-подобного синтаксиса без сборки.
// API полностью совместим с React, поэтому миграция на React+Vite=>npm безболезненна.

import { h, render, Fragment, createContext } from 'https://esm.sh/preact@10.22.0';
import { useState, useEffect, useMemo, useRef, useCallback, useReducer, useContext } from 'https://esm.sh/preact@10.22.0/hooks';
import htm from 'https://esm.sh/htm@3.1.1';

export const html = htm.bind(h);
export {
  h, render, Fragment, createContext,
  useState, useEffect, useMemo, useRef, useCallback, useReducer, useContext,
};

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import { LitElement, html, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { data } from './mockData';

declare const fuzzysort: Fuzzysort.Fuzzysort;

const EMPTY_RESULTS:Fuzzysort.Results = [] as any;
Object.defineProperty(EMPTY_RESULTS,"total",{writable: false});

@customElement('my-element')
export class MyElement extends LitElement {
  static override styles = css`
   #auto-complete{
     position:relative;
   }
      ul {
           position: absolute;
           margin: 0;
           padding: 0;
           z-index: 1000;
           background: white;
           display: block;
           list-style-type: none;
           width: 50% ;
           border: 1px solid black;
         }
         li {
           padding: 10px;
         }
 
         li.active {
           background: gray;
         }
         [hidden] {
          display: none;
        }
  
    `;
  opened: any;
  highlightedEl: HTMLElement | Element | undefined;
  mouseEnter: boolean;
  _blur: boolean;

  static override get properties() {
    return {
      data: { type: Array },
      opened: { type: Boolean, reflect: true },
      list: { type: Object }
    };
  }
  get contentElement() {
    if (this._input) {
      return this._input;
    }
    this._input = this.shadowRoot?.getElementById('auto-complete');
    return this._input;
  }

  constructor() {
    super();
    this.listenerHandlers = [{ callback: this.onFocus, eventName: 'focus' },
    { callback: this.onBlur, eventName: 'blur' },
    { callback: this.onKeyDown, eventName: 'keydown' },
    { callback: this.onKeyUp, eventName: 'keyup' }];
  }


  @property({ type: Array }) listenerHandlers;

  @property({ attribute: false }) results: Fuzzysort.Results = EMPTY_RESULTS;

  @property() keyword = '';

  @query('input', true) _input!: HTMLElement | HTMLInputElement | null | undefined;
  @query('ul', true) list!: HTMLElement | null | undefined;


  override disconnectedCallback() {
    super.disconnectedCallback()
    this.removeListeners();
  }

  setListeners() {
    this.list = this.shadowRoot?.getElementById('list');

    this.listenerHandlers.forEach(handler => {
      this.contentElement?.addEventListener(
        handler.eventName,
        handler.callback.bind(this)
      );
    })
  }
  removeListeners() {
    this.listenerHandlers.forEach(handler => {
      this.contentElement?.removeEventListener(
        handler.eventName,
        handler.callback.bind(this)
      );
    })
  }
  override firstUpdated() {
    super.connectedCallback()
    this.setListeners()
  }
  override updated(changed: { has: (arg0: string) => any; }) {
    if (
      changed.has('opened') &&
      this.opened &&
      this.list?.childElementCount
    ) {
      for (const item of this.list.children) {
        item.classList.remove('active');
      }
      this.highlightedEl = this.list.children[0];
      this.highlightedEl.classList.add('active');
    }
  }
  onKeyDown(ev: KeyboardEvent): void {
    if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  onKeyUp(ev: { key: any; preventDefault: () => void; stopPropagation: () => void; }) {
    switch (ev.key) {
      case 'ArrowUp':
        ev.preventDefault();
        ev.stopPropagation();
        this.markPreviousElement();
        break;

      case 'ArrowDown':
        ev.preventDefault();
        ev.stopPropagation();

        this.markNextElement();
        break;

      case 'Enter':
        this.highlightedEl && (this.highlightedEl as HTMLElement).click();
        break;

      case `Escape`:
        this.results = EMPTY_RESULTS;
        this.keyword = '';
        (this._input as HTMLInputElement).value = '';
        this.close()
        break;


    }
  }

  markPreviousElement() {
    if (!this.highlightedEl || !this.highlightedEl.previousElementSibling) {
      return;
    }

    this.highlightedEl.classList.remove('active');
    this.highlightedEl = this.highlightedEl.previousElementSibling;
    this.highlightedEl.classList.add('active');
  }

  markNextElement() {
    if (!this.highlightedEl || !this.highlightedEl.nextElementSibling) {
      return;
    }

    this.highlightedEl.classList.remove('active');
    this.highlightedEl = this.highlightedEl.nextElementSibling;
    this.highlightedEl.classList.add('active');
  }

  onFocus() {
    this._blur = false;
    this.results.length && this.open();
  }

  onBlur() {
    this._blur = true;
    !this.mouseEnter && this.close();
  }

  handleItemMouseEnter() {
    this.mouseEnter = true;
  }

  handleItemMouseLeave() {
    this.mouseEnter = false;
    this._blur && setTimeout(() => this.close(), 500);
  }

  open() {
    if (this.results.length) {
      this.opened = true;
    }
  }

  close() {
    this.results = EMPTY_RESULTS;
    this.opened = false;
    this.highlightedEl = null;
  }

  onItemClick(index: number) {
    console.log(this.results[index].target)
    this.highlightedEl.classList.remove('active');
    this.highlightedEl = this.list.children[index]
    this.highlightedEl.classList.add('active');
  }

  onChangeHandler(e: Event) {
    this.keyword = (e.currentTarget as any).value;
    this.results = fuzzysort.go((e.currentTarget as any).value, data);
    this.opened = this.results.length > 0
    this.results.length == 0 && this.close();
  }

  override render() {
    return html`
        <h1>Lit AutoComplete</h1>
        <div>
          <input
           id="auto-complete"
            type="text"
            value=${this.keyword}
            @input=${(e: Event) => this.onChangeHandler(e)}
        
          />          
         <ul id="list"
          @mouseenter=${this.handleItemMouseEnter}
        @mouseleave=${this.handleItemMouseLeave}
        ?hidden=${!this.opened}
        >      
        ${(this.results !== null && this.results.length > 0)
        ? this.results.map((item: any, index: number) => {
          return html`<li key=${index} .innerHTML=${fuzzysort.highlight(fuzzysort.single(this.keyword, item),  '<b>', '</b>')}  @click=${() => this.onItemClick(index)}  ></li>`;
        })
        : null
      }
                </ul>        
        </div>`;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement;
  }
}
/**
 * @template T
 * @template {keyof T} Key
 * @param {T} obj
 * @param {Key} p
 * @param {(fn: T[Key]) => T[Key]} fn
 */
export function patch(obj, p, fn) {
  if (!obj[p]) return;
  
  const original = obj[p];
  const wrapper = fn(original);
  
  // 精确检测原函数的所有特征
  const originalString = Function.prototype.toString.call(original);
  const isAsync = isAsyncFunction(original);
  const isGenerator = isGeneratorFunction(original);
  const isNative = originalString.includes('[native code]');
  const isBound = originalString.includes('[bound]') || original.name.startsWith('bound ');
  
  // 创建完美匹配的包装函数
  let patched;
  
  if (isAsync) {
    patched = async function(...args) {
      return await wrapper.apply(this, args);
    };
  } else if (isGenerator) {
    patched = function*(...args) {
      yield* wrapper.apply(this, args);
    };
  } else {
    patched = function(...args) {
      return wrapper.apply(this, args);
    };
  }
  
  // 深度复制所有属性（包括不可枚举和Symbol属性）
  copyAllProperties(original, patched);
  
  // 精确设置关键属性
  Object.defineProperties(patched, {
    name: { 
      value: original.name,
      configurable: true,
      enumerable: false,
      writable: false
    },
    length: { 
      value: original.length,
      configurable: true,
      enumerable: false,
      writable: false
    },
    toString: {
      value: () => originalString,
      configurable: true,
      enumerable: false,
      writable: true
    }
  });
  
  // 精确设置Symbol属性
  setupSymbolProperties(original, patched, isAsync, isGenerator);
  
  // 设置正确的原型链
  Object.setPrototypeOf(patched, Object.getPrototypeOf(original));
  
  // 特殊处理：如果原函数是bind创建的绑定函数
  if (isBound) {
    setupBoundFunctionProperties(original, patched);
  }
  
  // 特殊处理：如果原函数是类构造函数
  if (isClassConstructor(original)) {
    setupClassConstructorProperties(original, patched);
  }
  
  // 替换原函数，保持属性描述符
  const originalDescriptor = Object.getOwnPropertyDescriptor(obj, p) || {
    configurable: true,
    enumerable: true,
    writable: true
  };
  
  Object.defineProperty(obj, p, {
    ...originalDescriptor,
    value: patched
  });

  return original;
}

// 精确检测异步函数
function isAsyncFunction(fn) {
  try {
    return fn instanceof Object.getPrototypeOf(async function(){}).constructor ||
           fn.constructor.name === 'AsyncFunction' ||
           fn[Symbol.toStringTag] === 'AsyncFunction' ||
           Function.prototype.toString.call(fn).startsWith('async');
  } catch (e) {
    return false;
  }
}

// 检测生成器函数
function isGeneratorFunction(fn) {
  try {
    return fn instanceof Object.getPrototypeOf(function*(){}).constructor ||
           fn.constructor.name === 'GeneratorFunction' ||
           fn[Symbol.toStringTag] === 'GeneratorFunction' ||
           Function.prototype.toString.call(fn).includes('function*');
  } catch (e) {
    return false;
  }
}

// 检测类构造函数
function isClassConstructor(fn) {
  try {
    return typeof fn === 'function' && 
           Function.prototype.toString.call(fn).startsWith('class') ||
           fn.toString().startsWith('class');
  } catch (e) {
    return false;
  }
}

// 深度复制所有属性
function copyAllProperties(source, target) {
  // 复制所有自有属性（包括不可枚举）
  const allProps = [
    ...Object.getOwnPropertyNames(source),
    ...Object.getOwnPropertySymbols(source)
  ];
  
  for (const prop of allProps) {
    // 跳过一些特殊属性，我们会单独处理
    if (prop === 'name' || prop === 'length' || prop === 'arguments' || 
        prop === 'caller' || prop === 'prototype' || prop === Symbol.toStringTag) {
      continue;
    }
    
    try {
      const descriptor = Object.getOwnPropertyDescriptor(source, prop);
      if (descriptor) {
        Object.defineProperty(target, prop, descriptor);
      }
    } catch (e) {
      // 忽略无法复制的属性
    }
  }
}

// 设置Symbol属性
function setupSymbolProperties(original, patched, isAsync, isGenerator) {
  // 精确设置Symbol.toStringTag
  const toStringTagDescriptor = Object.getOwnPropertyDescriptor(original, Symbol.toStringTag);
  if (toStringTagDescriptor) {
    Object.defineProperty(patched, Symbol.toStringTag, toStringTagDescriptor);
  } else {
    // 根据函数类型设置正确的toStringTag
    let tag = 'Function';
    if (isAsync) tag = 'AsyncFunction';
    else if (isGenerator) tag = 'GeneratorFunction';
    
    Object.defineProperty(patched, Symbol.toStringTag, {
      value: tag,
      configurable: true,
      enumerable: false,
      writable: false
    });
  }
  
  // 复制其他Symbol属性
  const symbolProps = Object.getOwnPropertySymbols(original);
  for (const sym of symbolProps) {
    if (sym !== Symbol.toStringTag) {
      try {
        const descriptor = Object.getOwnPropertyDescriptor(original, sym);
        if (descriptor) {
          Object.defineProperty(patched, sym, descriptor);
        }
      } catch (e) {
        // 忽略无法复制的Symbol
      }
    }
  }
}

// 处理绑定函数的特殊属性
function setupBoundFunctionProperties(original, patched) {
  try {
    // 复制绑定函数的特殊属性
    if (original.hasOwnProperty('[[BoundTargetFunction]]')) {
      Object.defineProperty(patched, '[[BoundTargetFunction]]', {
        value: original['[[BoundTargetFunction]]'],
        configurable: false,
        enumerable: false,
        writable: false
      });
    }
    
    if (original.hasOwnProperty('[[BoundThis]]')) {
      Object.defineProperty(patched, '[[BoundThis]]', {
        value: original['[[BoundThis]]'],
        configurable: false,
        enumerable: false,
        writable: false
      });
    }
    
    if (original.hasOwnProperty('[[BoundArguments]]')) {
      Object.defineProperty(patched, '[[BoundArguments]]', {
        value: original['[[BoundArguments]]'],
        configurable: false,
        enumerable: false,
        writable: false
      });
    }
  } catch (e) {
    // 忽略内部属性设置失败
  }
}

// 处理类构造函数的特殊属性
function setupClassConstructorProperties(original, patched) {
  try {
    // 确保prototype属性正确
    if (original.prototype) {
      Object.defineProperty(patched, 'prototype', {
        value: original.prototype,
        configurable: false,
        enumerable: false,
        writable: true
      });
    }
  } catch (e) {
    // 忽略设置失败
  }
}

// 反检测辅助函数
function antiDetectionCheck(original, patched) {
  // 验证所有可能的检测点
  const checks = [
    () => original.name === patched.name,
    () => original.length === patched.length,
    () => original.toString() === patched.toString(),
    () => Object.getOwnPropertyDescriptor(original, 'name')?.configurable === 
          Object.getOwnPropertyDescriptor(patched, 'name')?.configurable,
    () => Object.getPrototypeOf(original) === Object.getPrototypeOf(patched),
    () => {
      const originalTag = Object.getOwnPropertyDescriptor(original, Symbol.toStringTag);
      const patchedTag = Object.getOwnPropertyDescriptor(patched, Symbol.toStringTag);
      return (!originalTag && !patchedTag) || 
             (originalTag && patchedTag && originalTag.value === patchedTag.value);
    }
  ];
  
  return checks.every(check => {
    try {
      return check();
    } catch (e) {
      return false;
    }
  });
}

export function addStyle(css) {
  if (css instanceof URL) {
    const style = document.createElement('link')
    style.rel = 'stylesheet'
    style.href = css.toString()
    document.documentElement.appendChild(style)
  } else {
    const style = document.createElement('style')
    style.textContent = css
    document.documentElement.appendChild(style)
  }
}

function trap(callback) {
  patch(Function.prototype, 'bind', _bind => {
    return function (self2, ...args) {
      if (
        typeof self2 === 'object' &&
        self2 !== null &&
        Object.prototype.hasOwnProperty.call(self2, 'editingTarget') &&
        Object.prototype.hasOwnProperty.call(self2, 'runtime')
      ) {
        Function.prototype.bind = _bind
        callback(self2)
        return _bind.call(this, self2, ...args)
      }
      return _bind.call(this, self2, ...args)
    }
  })
}

export const vm = globalThis.__CSense_vm_trap ?? new Promise(trap)
delete globalThis.__CSense_vm_trap

// Dummy interceptor receiver for lazy Axios
export class LazyXHR {
  constructor() {
    this.interceptors = {
      request: {
        handlers: [],
        use: (fulfilled, rejected, options) => {
          this.interceptors.request.handlers.push({
            fulfilled,
            rejected,
            synchronous: false,
            runWhen: options?.runWhen ?? null
          })
        }
      },
      response: {
        handlers: [],
        use: (fulfilled, rejected, options) => {
          this.interceptors.response.handlers.push({
            fulfilled,
            rejected,
            synchronous: false,
            runWhen: options?.runWhen ?? null
          })
        }
      }
    }
  }
  delegate(axiosInstance) {
    // Migrate interceptors
    axiosInstance.interceptors.request.handlers.unshift(
      ...this.interceptors.request.handlers
    )
    axiosInstance.interceptors.response.handlers.unshift(
      ...this.interceptors.response.handlers
    )
  }
}

// function patchXHR(callback) {
//   const _XMLHttpRequest = window.XMLHttpRequest
//   window.XMLHttpRequest = new Proxy(_XMLHttpRequest, {
//     construct(target, args) {
//       const xhr = new target(...args)
//       let request = null
//       patch(xhr, 'open', _open => {
//         return function (method, url) {
//           if (url === 'https://community-web.ccw.site/base/dateTime') {
//             return _open.call(
//               this,
//               method,
//               `data:application/json,{"body": ${Date.now()}, "code": "200", "msg": null, "status": 200}`
//             )
//           }
//           if (url === 'https://community-web.ccw.site/project/v') {
//             return _open.call(
//               this,
//               method,
//               'data:application/json,{"body": true, "code": "200", "msg": null, "status": 200}'
//             )
//           }
//           if (url.startsWith('https://mustang.xiguacity.cn/')) {
//             return _open.call(this, method, 'data:application/json,{}')
//           }
//           return _open.call(this, method, url)
//         }
//       })
//       patch(xhr, 'send', _send => {
//         return function (data) {
//           request = data
//           return _send.call(this, data)
//         }
//       })
//       xhr.addEventListener('load', () => {
//         if (xhr.responseType === '' || xhr.responseType === 'text') {
//           callback({
//             url: xhr.responseURL,
//             type: xhr.responseType,
//             data: xhr.responseText,
//             request
//           })
//         }
//       })
//       return xhr
//     }
//   })
// }

// export const XHR = new EventTarget()
// patchXHR(v => {
//   XHR.dispatchEvent(new CustomEvent('load', { detail: v }))
// })

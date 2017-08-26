/**
 * @author Dmitry Rusakov (jkikksa@gmail.com)
 */

'use strict';

(function () {

  /**
   * Форма.
   * @type {Element}
   */
  const form = document.querySelector('#myForm');

  /**
   * Список инпутов формы с классом "form__input".
   * @type {NodeList}
   */
  const fields = form.querySelectorAll('.form__input');

  /**
   * Кнопка отправки формы.
   * @type {Element}
   */
  const submitButton = document.querySelector('#submitButton');

  /**
   * Контейнер для вывода результата работы формы.
   * @type {Element}
   */
  const resultContainer = document.querySelector('#resultContainer');

  /**
   * Классы, которые добавляются элементам страницы.
   * @enum {string}
   */
  const ClassName = {
    ERROR: 'error',
    SUCCESS: 'success',
    PROGRESS: 'progress'
  };

  /**
   * Частичный список кодов ответа сервера.
   * @enum {number}
   */
  const HTTPCode = {
    SUCCESS: 200,
    PAGE_NOT_FOUND: 404,
    SERVER_ERROR: 500
  };

  /**
   * Карта соответствия имени поля формы с самим полем.
   * @type {Object<string, Element>}
   */
  const namesToFields = Array.prototype.reduce.call(fields, (obj, it) => {
    obj[it.name] = it;
    return obj;
  }, {});

  /**
   * Добавляет полю field класс ошибки "ClassName.ERROR".
   * @param {Element} field
   */
  const addError = (field) => {
    field.classList.add(ClassName.ERROR);
  };

  /**
   * Удаляет у поля field класс ошибки "ClassName.ERROR".
   * @param {Element} field
   */
  const removeError = (field) => {
    field.classList.remove(ClassName.ERROR);
  };

  /**
   * Необходимое количество слов в поле "ФИО".
   * @const
   * @type {number}
   */
  const REQUIRED_WORDS_AMOUNT = 3;

  /**
   * Сравнивает количество слов в значении поля "field" с необходимым количеством слов.
   * @param {Element} field
   * @return {boolean}
   */
  const isNameValid = (field) => {
    return field.value.trim().split(' ').length === REQUIRED_WORDS_AMOUNT;
  };

  /**
   * Массив разрешенных доменов.
   * @const
   * @type {Array<string>}
   */
  const VALID_DOMAINS = ['ya.ru', 'yandex.ru', 'yandex.ua', 'yandex.by', 'yandex.kz', 'yandex.com'];

  /**
   * Проверяет, что доменое имя в значении поля "field" находится в массиве разрешенных доменов.
   * @param {Element} field
   * @return {boolean}
   */
  const isDomainValid = (field) => {
    const domain = field.value.replace(/(.*)@/, '').toLowerCase();
    return VALID_DOMAINS.indexOf(domain) !== -1 ? true : false;
  };

  /**
   * Максимальная сумма всех цифр номера телефона.
   * @const
   * @type {number}
   */
  const MAX_SUM = 30;

  /**
   * Проверяет, что сумма всех цифр в значении поля "field" не превышает максимальную сумму цифр номера телефона.
   * @param {Element} field
   * @return {boolean}
   */
  const isPhoneValid = (field) => {
    return field.value.trim().replace(/\D/g, '').split('').reduce((acc, cur) => +acc + +cur) <= MAX_SUM;
  };

  /**
   * Проверяет правильность заполнения переданного поля стандартными средствами браузера.
   * @param {Element} field
   * @return {boolean}
   */
  const isValid = (field) => {
    return field.validity.valid;
  };

  /**
   * Проверяет на валидность значение переданного поля стандартными средствами браузера.
   * В случае если эта проверка пройдена, то, в зависимости от имени поля вызывается дополнительная функция проверки.
   * @param {Element} field
   * @return {boolean}
   */
  const isFieldValid = (field) => {
    switch (field.name) {
      case 'fio':
        return isValid(field) && isNameValid(field);
      case 'email':
        return isValid(field) && isDomainValid(field);
      case 'phone':
        return isValid(field) && isPhoneValid(field);
      default:
        return isValid(field);
    }
  };

  /**
   * Переменная, в которой хранится название текущего класса блока "resultContainer".
   * @type {!string}
   */
  let currentClassName = null;

  /**
   * При наличии у блока "resultContainer" класса "currentClassName" удаляет этот класс.
   */
  const removeCurrentClassName = () => {
    if (currentClassName !== null) {
      resultContainer.classList.remove(currentClassName);
    }
  };

  /**
   * Обработчик ответа от сервера со статусом "success".
   * Устанавливает блоку "resultContainer" класс "ClassName.SUCCESS".
   * Записывает в содержимое блока "resultContainer" текст "Success".
   * @param {string} successText
   */
  const onSuccess = () => {
    removeCurrentClassName();
    resultContainer.classList.add(ClassName.SUCCESS);
    currentClassName = ClassName.SUCCESS;
    resultContainer.textContent = 'Success';
  };

  /**
   * Обработчик ответа от сервера со статусом "error".
   * Устанавливает блоку "resultContainer" класс "ClassName.ERROR".
   * Записывает в содержимое блока "resultContainer" текст из параметра "reason".
   * @param {string} reason
   */
  const onError = (reason) => {
    removeCurrentClassName();
    resultContainer.classList.add(ClassName.ERROR);
    currentClassName = ClassName.ERROR;
    resultContainer.textContent = reason;
  };

  /**
   * Обработчик ответа от сервера со статусом "progress".
   * Устанавливает блоку "resultContainer" класс "ClassName.PROGRESS".
   * Вызывает функцию отправки запроса "send()" через время "timeout".
   * @param {number} timeout
   */
  const onProgress = (timeout) => {
    removeCurrentClassName();
    resultContainer.classList.add(ClassName.PROGRESS);
    currentClassName = ClassName.PROGRESS;
    setTimeout(send, timeout);
  };

  /**
   * Отправляет "AJAX" запрос с даными формы на адрес указанный в атрибуте "action" формы.
   * При получении ответа от сервера вызывает соответствующий ответу обработчик.
   */
  const send = () => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.open(form.method, form.action);

    xhr.addEventListener('load', () => {
      if (xhr.status === HTTPCode.SUCCESS) {
        const response = xhr.response;

        switch (response.status) {
          case 'success':
            onSuccess();
            break;
          case 'error':
            onError(response.reason);
            break;
          case 'progress':
            onProgress(response.timeout);
            break;
        }
      } else {
        onError('Ошибка! Код ошибки: ' + xhr.status);
      }
    });

    xhr.addEventListener('error', () => {
      onError('Ошибка соединения');
    });

    xhr.addEventListener('timeout', () => {
      onError('Превышено время ожидания');
    });

    xhr.send(new FormData(form));
  };

  /**
   * Определяет объект MyForm в глобальной области видимости.
   * @type {Object}
   */
  window.MyForm = {};

  /**
   * Производит валидацию полей формы.
   * Возвращает объект с признаком результата валидации ("isValid") и массивом названий полей, которые не прошли валидацию ("errorFields").
   * @return {Object<string, Array<string>|boolean>}
   */
  window.MyForm.validate = () => {
    let errorFields = [];
    let isFormValid = true;

    Array.prototype.forEach.call(fields, (it) => {
      if (!isFieldValid(it)) {
        errorFields.push(it);
        isFormValid = false;
        addError(it);
      } else {
        removeError(it);
      }
    });

    // Если есть поля, не прошедшие валидацию, то переносит фокус в первое невалидное поле.
    if (errorFields.length > 0) {
      errorFields[0].focus();
    }

    return {
      isValid: isFormValid,
      errorFields: errorFields.map((it) => it.name)
    };
  };

  /**
   * Возвращает объект с данными формы, где имена свойств совпадают с именами инпутов.
   * @return {Object<string, string>}
   */
  window.MyForm.getData = () => {
    return Array.prototype.reduce.call(fields, (obj, it) => {
      obj[it.name] = it.value;
      return obj;
    }, {});
  };

  /**
   * Принимает объект с данными формы и устанавливает их инпутам формы.
   * Если такого поля не существует, то оно игнорируется.
   * @param {Object<string, string>} obj
   */
  window.MyForm.setData = (obj) => {
    Object.keys(obj).forEach((it) => {
      if (typeof namesToFields[it] !== 'undefined') {
        namesToFields[it].value = obj[it];
      }
    });
  };

  /**
   * Выполняет валидацию полей и отправку ajax-запроса, если валидация пройдена.
   * Добавляет кнопке отправки формы неактивное состояние.
   */
  window.MyForm.submit = () => {
    if (window.MyForm.validate().isValid) {
      submitButton.disabled = true;
      send();
    }
  };

  /**
   * Обработчик нажатия на кнопку отправки формы. Вызывает метод "MyForm.submit()".
   */
  const onSubmitButtonClicked = () => {
    window.MyForm.submit();
  };

  /**
   * Добавляет событию нажатия на кнопку отправки формы одноименный обработчик.
   */
  submitButton.addEventListener('click', onSubmitButtonClicked);

  /**
   * Отменяет стандартную проверку браузером данных формы.
   */
  form.setAttribute('novalidate', true);

  /**
   * В случае наступления события "submit" отменяет отправку данных формы на сервер.
   */
  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
  });
})();
